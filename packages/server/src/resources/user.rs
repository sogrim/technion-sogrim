use super::catalog::DisplayCatalog;
use crate::{
    core::degree_status::DegreeStatus,
    db::{Db, Resource},
    error::AppError,
    resources::course::AcademicSemester,
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
    /// Free-form Hebrew labels on empty calendar slots in the planner timeline
    /// (e.g. "מילואים", "חופשה"), keyed by the linear calendar idx
    /// (`year*3 + season`, where winter/spring/summer = 0/1/2) as a string.
    /// String keys keep BSON happy and round-trip cleanly through JSON.
    #[serde(default)]
    pub timeline_annotations: std::collections::HashMap<String, String>,
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
    pub current_semester: Option<AcademicSemester>,
    #[serde(default)]
    pub active_draft_id: Option<String>,
    #[serde(default)]
    pub drafts: Vec<TimetableDraft>,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct TimetableDraft {
    pub id: String,
    pub name: String,
    pub semester: AcademicSemester,
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
    pub permissions: Permissions,
    pub details: UserDetails,
    pub settings: UserSettings,
    #[serde(default)]
    pub timetable: TimetableState,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_seen: Option<DateTime>,
}

impl User {
    /// On first login after the legacy-string semester format was retired, this
    /// rewrites any `cs.semester` that still carries a `legacy_name` into a
    /// fully-typed `AcademicSemester` with concrete (season, start_year). It
    /// returns `true` only when at least one semester actually changed, so the
    /// caller can avoid a redundant DB write.
    pub fn normalize_legacy_semesters(&mut self) -> bool {
        let legacy_names: Vec<String> = self
            .details
            .degree_status
            .course_statuses
            .iter()
            .filter_map(|cs| cs.semester.as_ref().and_then(AcademicSemester::legacy_name))
            .map(String::from)
            .collect();

        if legacy_names.is_empty() {
            return false;
        }

        let resolution = AcademicSemester::resolve_legacy_names(&legacy_names);

        let mut changed = false;
        for cs in &mut self.details.degree_status.course_statuses {
            let Some(current) = &cs.semester else { continue };
            let Some(legacy) = current.legacy_name() else {
                continue;
            };
            let resolved = resolution
                .get(legacy)
                .cloned()
                .unwrap_or_else(|| AcademicSemester::new(current.season, current.start_year));
            cs.semester = Some(resolved);
            changed = true;
        }
        changed
    }
}

impl Resource for User {
    fn collection_name() -> &'static str {
        "Users"
    }
    fn key(&self) -> Document {
        doc! {"_id": self.sub.clone()}
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
