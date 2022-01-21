#[allow(unused_imports)] // TODO: uncomment this for authentication
use crate::{
    db,
    resources::{admin::Admin, course::Course},
};
use actix_web::{delete, error::ErrorBadRequest, get, put, web, Error, HttpResponse};
use bson::doc;
use mongodb::Client;

#[get("/courses")]
pub async fn get_all_courses(
    //_: Admin,  // TODO: uncomment this for authentication
    client: web::Data<Client>,
) -> Result<HttpResponse, Error> {
    db::services::get_all_courses(&client)
        .await
        .map(|courses| HttpResponse::Ok().json(courses))
}

#[get("/courses/{id}")]
pub async fn get_course_by_id(
    //_: Admin, // TODO: uncomment this for authentication
    id: web::Path<String>,
    client: web::Data<Client>,
) -> Result<HttpResponse, Error> {
    db::services::get_course_by_id(&id, &client)
        .await
        .map(|course| HttpResponse::Ok().json(course))
}

#[put("/courses/{id}")]
pub async fn create_or_update_course(
    //_: Admin, // TODO: uncomment this for authentication
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
    //_: Admin, // TODO: uncomment this for authentication
    id: web::Path<String>,
    client: web::Data<Client>,
) -> Result<HttpResponse, Error> {
    db::services::delete_course(&id, &client)
        .await
        .map(|_| HttpResponse::Ok().finish())
}

// TODO: CRUD for catalog
// get catalog by id (HTTP GET)
// update or create catalog by id (HTTP PUT)
