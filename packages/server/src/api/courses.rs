use std::sync::Arc;

use axum::{extract::Path, http::StatusCode, response::IntoResponse, Extension, Json};

use crate::disk_cache::DiskCourseCache;

pub async fn get_semesters(Extension(cache): Extension<Arc<DiskCourseCache>>) -> impl IntoResponse {
    let semesters = cache.discover_semesters();
    Json(semesters)
}

pub async fn get_course_index(
    Extension(cache): Extension<Arc<DiskCourseCache>>,
    Path((year, semester)): Path<(String, String)>,
) -> impl IntoResponse {
    match cache.get_index(&year, &semester).await {
        Some(index) => Json(&*index).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

pub async fn get_course(
    Extension(cache): Extension<Arc<DiskCourseCache>>,
    Path((year, semester, course_id)): Path<(String, String, String)>,
) -> impl IntoResponse {
    match cache.get_course(&year, &semester, &course_id).await {
        Some(details) => Json(&*details).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}
