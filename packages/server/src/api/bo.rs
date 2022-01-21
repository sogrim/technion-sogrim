use std::str::FromStr;

use crate::resources::catalog::Catalog;
use crate::{
    db,
    resources::{admin::Admin, course::Course},
};
use actix_web::{
    delete,
    error::{ErrorBadRequest, ErrorInternalServerError},
    get, put, web, Error, HttpResponse,
};
use bson::doc;
use mongodb::Client;

/////////////////////////////////////////////////////////////////////////////
// Course API
/////////////////////////////////////////////////////////////////////////////

#[get("/courses")]
pub async fn get_all_courses(_: Admin, client: web::Data<Client>) -> Result<HttpResponse, Error> {
    db::services::get_all_courses(&client)
        .await
        .map(|courses| HttpResponse::Ok().json(courses))
}

#[get("/courses/{id}")]
pub async fn get_course_by_id(
    _: Admin,
    id: web::Path<String>,
    client: web::Data<Client>,
) -> Result<HttpResponse, Error> {
    db::services::get_course_by_id(&id, &client)
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[put("/courses/{id}")]
pub async fn create_or_update_course(
    _: Admin,
    id: web::Path<String>,
    course: web::Json<Course>,
    client: web::Data<Client>,
) -> Result<HttpResponse, Error> {
    let course_doc = bson::to_document(&course).map_err(ErrorBadRequest)?;
    let document = doc! {"$setOnInsert" : course_doc};
    db::services::find_and_update_course(&id, document, &client)
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[delete("/courses/{id}")]
pub async fn delete_course(
    _: Admin,
    id: web::Path<String>,
    client: web::Data<Client>,
) -> Result<HttpResponse, Error> {
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
    id: web::Path<String>,
    client: web::Data<Client>,
) -> Result<HttpResponse, Error> {
    let obj_id = bson::oid::ObjectId::from_str(&id).map_err(ErrorInternalServerError)?;
    db::services::get_catalog_by_id(&obj_id, &client)
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[put("/catalogs/{id}")]
pub async fn create_or_update_catalog(
    _: Admin,
    id: web::Path<String>,
    catalog: web::Json<Catalog>,
    client: web::Data<Client>,
) -> Result<HttpResponse, Error> {
    let obj_id = bson::oid::ObjectId::from_str(&id).map_err(ErrorInternalServerError)?;
    let catalog_doc = bson::to_document(&catalog).map_err(ErrorBadRequest)?;
    let document = doc! {"$setOnInsert" : catalog_doc};
    db::services::find_and_update_catalog(&obj_id, document, &client)
        .await
        .map(|catalog| HttpResponse::Ok().json(catalog))
}
