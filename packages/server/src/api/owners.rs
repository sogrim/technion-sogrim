use std::str::FromStr;

use crate::core::catalog_validations;
use crate::db::Db;
use crate::error::AppError;
use crate::resources::catalog::Catalog;
use crate::resources::{course::Course, user::User};
use axum::{extract::Path, response::IntoResponse, Extension, Json};
use http::StatusCode;

/////////////////////////////////////////////////////////////////////////////
// Course API
/////////////////////////////////////////////////////////////////////////////

pub async fn get_all_courses(
    _: User,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    db.get_all::<Course>().await.map(Json)
}

pub async fn get_course_by_id(
    _: User,
    Path(id): Path<String>,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    db.get::<Course>(id.as_str()).await.map(Json)
}

pub async fn create_or_update_course(
    _: User,
    Path(_id): Path<String>,
    Extension(db): Extension<Db>,
    Json(course): Json<Course>,
) -> Result<impl IntoResponse, AppError> {
    db.create_or_update::<Course>(course).await.map(Json)
}

pub async fn delete_course(
    _: User,
    Path(id): Path<String>,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    db.delete::<Course>(id.as_str())
        .await
        .map(|_| StatusCode::OK)
}

/////////////////////////////////////////////////////////////////////////////
// Catalog API
/////////////////////////////////////////////////////////////////////////////

pub async fn get_catalog_by_id(
    _: User,
    Path(id): Path<String>,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    let obj_id = bson::oid::ObjectId::from_str(&id).map_err(|e| AppError::Bson(e.to_string()))?;
    db.get::<Catalog>(&obj_id).await.map(Json)
}

pub async fn create_or_update_catalog(
    _: User,
    Path(_id): Path<String>,
    Extension(db): Extension<Db>,
    Json(catalog): Json<Catalog>,
) -> Result<impl IntoResponse, AppError> {
    catalog_validations::validate_catalog(&catalog)?;
    db.create_or_update::<Catalog>(catalog).await.map(Json)
}
