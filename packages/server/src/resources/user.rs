use super::catalog::DisplayCatalog;
use crate::{
    core::degree_status::DegreeStatus,
    db::{Db, Resource},
    error::AppError,
};

/// Google JWT subject identifier (unique user ID).
pub type Sub = String;
use axum::{extract::FromRequestParts, Extension};
use bson::{doc, DateTime, Document};
use http::request::Parts;
use serde::{Deserialize, Serialize};

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    pub catalog: Option<DisplayCatalog>,
    pub degree_status: DegreeStatus,
    pub compute_in_progress: bool,
    pub modified: bool,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserSettings {
    pub dark_mode: bool,
    /// Color palette identifier. None until the user picks one — the frontend
    /// falls back to its DEFAULT_PALETTE when this field is absent.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub palette: Option<String>,
}

// ---------------------------------------------------------------------------
// Timetable persistence
// ---------------------------------------------------------------------------

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct TimetableState {
    #[serde(default)]
    pub current_semester: Option<String>,
    #[serde(default)]
    pub active_draft_id: Option<String>,
    #[serde(default)]
    pub drafts: Vec<TimetableDraft>,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct TimetableDraft {
    pub id: String,
    pub name: String,
    pub semester: String,
    #[serde(default)]
    pub courses: Vec<CourseSelection>,
    #[serde(default)]
    pub custom_events: Vec<CustomEvent>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub is_published: bool,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CourseSelection {
    pub course_id: String,
    #[serde(default)]
    pub selected_groups: std::collections::HashMap<String, String>,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CustomEvent {
    pub id: String,
    pub title: String,
    pub day: u8,
    pub start_time: String,
    pub end_time: String,
    #[serde(default)]
    pub color: Option<String>,
}

#[derive(Default, Clone, Copy, Debug, Deserialize, Serialize, PartialEq, PartialOrd)]
pub enum Permissions {
    #[default]
    Student = 0,
    Admin = 1,
    Owner = 2,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
    // `default` so a legacy/partial document missing these fields still
    // deserializes (permissions falls back to Student — least privilege) instead
    // of failing the whole read. This matters for the back-office users list,
    // where one bad document would otherwise 500 the entire endpoint.
    #[serde(default)]
    pub permissions: Permissions,
    #[serde(default)]
    pub details: UserDetails,
    #[serde(default)]
    pub settings: UserSettings,
    #[serde(default)]
    pub timetable: TimetableState,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_seen: Option<DateTime>,
}

impl Resource for User {
    fn collection_name() -> &'static str {
        "Users"
    }
    fn key(&self) -> Document {
        doc! {"_id": self.sub.clone()}
    }
}

/// Lightweight projection of a [`User`] for the back-office users list. Keeps
/// the list response small (and the full degree status / timetable out of it)
/// while still surfacing the fields an admin scans by.
#[derive(Clone, Debug, Serialize)]
pub struct UserSummary {
    pub sub: String,
    pub permissions: Permissions,
    pub catalog_name: Option<String>,
    pub total_credit: f32,
    pub num_courses: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_seen: Option<DateTime>,
}

impl From<&User> for UserSummary {
    fn from(user: &User) -> Self {
        UserSummary {
            sub: user.sub.clone(),
            permissions: user.permissions,
            catalog_name: user.details.catalog.as_ref().map(|c| c.name.clone()),
            total_credit: user.details.degree_status.total_credit,
            num_courses: user.details.degree_status.course_statuses.len(),
            last_seen: user.last_seen,
        }
    }
}

impl FromRequestParts<()> for User {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &()) -> Result<Self, Self::Rejection> {
        let Extension(db) = Extension::<Db>::from_request_parts(parts, state)
            .await
            .map_err(|_| {
                AppError::InternalServer("Mongodb client not found in application data".into())
            })?;
        let Extension(permissions) = Extension::<Permissions>::from_request_parts(parts, state)
            .await
            .map_err(|_| {
                AppError::InternalServer("Permissions not found in application data".into())
            })?;
        let id =
            parts.extensions.get::<Sub>().cloned().ok_or_else(|| {
                AppError::Middleware("Sub not found in request extensions".into())
            })?;
        let user = db.get::<User>(id).await?;
        if user.permissions < permissions {
            return Err(AppError::Unauthorized(
                "User not authorized to access this resource".into(),
            ));
        }
        Ok(user)
    }
}

#[cfg(test)]
mod user_summary_tests {
    use super::*;
    use crate::resources::catalog::{DisplayCatalog, Faculty};
    use crate::resources::course::CourseStatus;
    use bson::oid::ObjectId;

    fn display_catalog(name: &str) -> DisplayCatalog {
        DisplayCatalog {
            id: ObjectId::new(),
            name: name.to_string(),
            faculty: Faculty::ComputerScience,
            total_credit: 118.5,
            description: String::new(),
            course_bank_names: vec![],
            year: 2024,
        }
    }

    #[test]
    fn user_summary_projects_the_key_fields() {
        let mut user = User {
            sub: "11112222".to_string(),
            permissions: Permissions::Admin,
            ..Default::default()
        };
        user.details.catalog = Some(display_catalog("מדמח תלת שנתי 2024-2025"));
        user.details.degree_status.total_credit = 76.5;
        user.details.degree_status.course_statuses =
            vec![CourseStatus::default(), CourseStatus::default()];

        let summary = UserSummary::from(&user);

        assert_eq!(summary.sub, "11112222");
        assert_eq!(summary.permissions, Permissions::Admin);
        assert_eq!(
            summary.catalog_name.as_deref(),
            Some("מדמח תלת שנתי 2024-2025")
        );
        assert_eq!(summary.total_credit, 76.5);
        assert_eq!(summary.num_courses, 2);
    }

    #[test]
    fn user_summary_has_no_catalog_name_when_unset() {
        let user = User {
            sub: "no-catalog".to_string(),
            ..Default::default()
        };
        let summary = UserSummary::from(&user);
        assert_eq!(summary.catalog_name, None);
        assert_eq!(summary.num_courses, 0);
    }
}
