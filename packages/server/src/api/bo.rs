use std::str::FromStr;

use crate::error::AppError;
use crate::resources::catalog::Catalog;
use crate::{
    db,
    resources::{admin::Admin, course::Course},
};
use actix_web::web::{Data, Json, Path};
use actix_web::{delete, get, put, HttpResponse};
use bson::doc;

/////////////////////////////////////////////////////////////////////////////
// Course API
/////////////////////////////////////////////////////////////////////////////

#[get("/courses")]
pub async fn get_all_courses(
    _: Admin,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    db::services::get_all_courses(&client)
        .await
        .map(|courses| HttpResponse::Ok().json(courses))
}

#[get("/courses/{id}")]
pub async fn get_course_by_id(
    _: Admin,
    id: Path<String>,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    db::services::get_course_by_id(&id, &client)
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[put("/courses/{id}")]
pub async fn create_or_update_course(
    _: Admin,
    id: Path<String>,
    course: Json<Course>,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    let course_doc = bson::to_document(&course).map_err(|e| AppError::Bson(e.to_string()))?;
    let document = doc! {"$setOnInsert" : course_doc};
    db::services::find_and_update_course(&id, document, &client)
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[delete("/courses/{id}")]
pub async fn delete_course(
    _: Admin,
    id: Path<String>,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    db::services::delete_course(&id, &client)
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
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    let obj_id = bson::oid::ObjectId::from_str(&id).map_err(|e| AppError::Bson(e.to_string()))?;
    db::services::get_catalog_by_id(&obj_id, &client)
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[put("/catalogs/{id}")]
pub async fn create_or_update_catalog(
    _: Admin,
    id: Path<String>,
    catalog: Json<Catalog>,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    let obj_id = bson::oid::ObjectId::from_str(&id).map_err(|e| AppError::Bson(e.to_string()))?;
    let catalog_doc = bson::to_document(&catalog).map_err(|e| AppError::Bson(e.to_string()))?;
    let document = doc! {"$setOnInsert" : catalog_doc};
    db::services::find_and_update_catalog(&obj_id, document, &client)
        .await
        .map(|catalog| HttpResponse::Ok().json(catalog))
}
