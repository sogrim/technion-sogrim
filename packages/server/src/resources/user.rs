use super::catalog::DisplayCatalog;
use crate::{
    core::degree_status::DegreeStatus,
    db::{Db, Resource},
    error::AppError,
    middleware::jwt_decoder::Sub,
};
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
    pub permissions: Permissions,
    pub details: UserDetails,
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
