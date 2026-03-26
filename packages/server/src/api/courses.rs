use actix_web::{get, web, HttpResponse};

use crate::disk_cache::DiskCourseCache;

#[get("/semesters")]
pub async fn get_semesters(cache: web::Data<DiskCourseCache>) -> HttpResponse {
    let semesters = cache.discover_semesters();
    HttpResponse::Ok().json(semesters)
}

#[get("/courses/{year}/{semester}/index")]
pub async fn get_course_index(
    cache: web::Data<DiskCourseCache>,
    path: web::Path<(String, String)>,
) -> HttpResponse {
    let (year, semester) = path.into_inner();
    match cache.get_index(&year, &semester).await {
        Some(index) => HttpResponse::Ok().json(&*index),
        None => HttpResponse::NotFound().finish(),
    }
}

#[get("/courses/{year}/{semester}/{course_id}")]
pub async fn get_course(
    cache: web::Data<DiskCourseCache>,
    path: web::Path<(String, String, String)>,
) -> HttpResponse {
    let (year, semester, course_id) = path.into_inner();
    match cache.get_course(&year, &semester, &course_id).await {
        Some(details) => HttpResponse::Ok().json(&*details),
        None => HttpResponse::NotFound().finish(),
    }
}
