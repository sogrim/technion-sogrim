use std::str::FromStr;

use crate::core::catalog_validations;
use crate::db::Db;
use crate::error::AppError;
use crate::resources::catalog::Catalog;
use crate::resources::{admin::Admin, course::Course};
use actix_web::web::{Data, Json, Path};
use actix_web::{delete, get, put, HttpResponse};

/////////////////////////////////////////////////////////////////////////////
// Course API
/////////////////////////////////////////////////////////////////////////////

#[get("/courses")]
pub async fn get_all_courses(_: Admin, db: Data<Db>) -> Result<HttpResponse, AppError> {
    db.get_all::<Course>()
        .await
        .map(|courses| HttpResponse::Ok().json(courses))
}

#[get("/courses/{id}")]
pub async fn get_course_by_id(
    _: Admin,
    id: Path<String>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    db.get::<Course>(id.as_str())
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[put("/courses/{id}")]
pub async fn create_or_update_course(
    _: Admin,
    _id: Path<String>,
    course: Json<Course>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    db.create_or_update::<Course>(course.into_inner())
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[delete("/courses/{id}")]
pub async fn delete_course(
    _: Admin,
    id: Path<String>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    db.delete::<Course>(id.as_str())
        .await
        .map(|_| HttpResponse::Ok().finish())
}

/////////////////////////////////////////////////////////////////////////////
// Catalog API
/////////////////////////////////////////////////////////////////////////////

#[get("/catalogs/{id}")]
pub async fn get_catalog_by_id(
    _: Admin,
    id: Path<String>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    let obj_id = bson::oid::ObjectId::from_str(&id).map_err(|e| AppError::Bson(e.to_string()))?;
    db.get::<Catalog>(&obj_id)
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[put("/catalogs/{id}")]
pub async fn create_or_update_catalog(
    _: Admin,
    _id: Path<String>,
    catalog: Json<Catalog>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    catalog_validations::validate_catalog(&catalog)?;
    db.create_or_update::<Catalog>(catalog.into_inner())
        .await
        .map(|catalog| HttpResponse::Ok().json(catalog))
}
