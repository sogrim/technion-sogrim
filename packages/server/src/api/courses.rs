use actix_web::{get, web, HttpResponse};

use crate::sap::{CachedSapClient, SapError};

#[get("/semesters")]
pub async fn get_semesters(sap: web::Data<CachedSapClient>) -> HttpResponse {
    match sap.get_semesters().await {
        Ok(semesters) => HttpResponse::Ok().json(&*semesters),
        Err(e) => {
            log::error!(target: "sogrim_server", "SAP error fetching semesters: {e}");
            HttpResponse::BadGateway().finish()
        }
    }
}

#[get("/courses/{year}/{semester}")]
pub async fn get_course_ids(
    sap: web::Data<CachedSapClient>,
    path: web::Path<(String, String)>,
) -> HttpResponse {
    let (year, semester) = path.into_inner();
    match sap.get_course_ids(&year, &semester).await {
        Ok(ids) => HttpResponse::Ok().json(&*ids),
        Err(e) => {
            log::error!(target: "sogrim_server", "SAP error fetching course IDs: {e}");
            HttpResponse::BadGateway().finish()
        }
    }
}

#[get("/courses/{year}/{semester}/index")]
pub async fn get_course_index(
    sap: web::Data<CachedSapClient>,
    path: web::Path<(String, String)>,
) -> HttpResponse {
    let (year, semester) = path.into_inner();
    match sap.get_course_index(&year, &semester).await {
        Ok(index) => HttpResponse::Ok().json(&*index),
        Err(e) => {
            log::error!(target: "sogrim_server", "SAP error fetching course index: {e}");
            HttpResponse::BadGateway().finish()
        }
    }
}

#[get("/courses/{year}/{semester}/{course_id}")]
pub async fn get_course(
    sap: web::Data<CachedSapClient>,
    path: web::Path<(String, String, String)>,
) -> HttpResponse {
    let (year, semester, course_id) = path.into_inner();
    match sap.get_course_details(&year, &semester, &course_id).await {
        Ok(details) => HttpResponse::Ok().json(&*details),
        Err(SapError::NotFound(_)) => HttpResponse::NotFound().finish(),
        Err(e) => {
            log::error!(target: "sogrim_server", "SAP error fetching course {course_id}: {e}");
            HttpResponse::BadGateway().finish()
        }
    }
}
