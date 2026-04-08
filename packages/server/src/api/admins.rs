use std::sync::Arc;

use crate::core::degree_status::DegreeStatus;
use crate::core::parser;
use crate::db::Db;
use crate::disk_cache::DiskCourseCache;
use crate::error::AppError;
use crate::resources::catalog::Catalog;
use crate::resources::user::User;
use axum::{response::IntoResponse, Extension, Json};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComputeDegreeStatusPayload {
    pub catalog_id: bson::oid::ObjectId,
    pub grade_sheet_as_string: String,
}

pub async fn parse_courses_and_compute_degree_status(
    _admin: User,
    Extension(db): Extension<Db>,
    Extension(course_cache): Extension<Arc<DiskCourseCache>>,
    Json(payload): Json<ComputeDegreeStatusPayload>,
) -> Result<impl IntoResponse, AppError> {
    let catalog = db.get::<Catalog>(payload.catalog_id).await?;
    let course_statuses = parser::parse_copy_paste_data(&payload.grade_sheet_as_string)?;
    let mut degree_status = DegreeStatus {
        course_statuses,
        ..Default::default()
    };

    let courses = course_cache.get_all_courses().await;
    degree_status.compute(catalog, courses);

    Ok(Json(degree_status))
}
