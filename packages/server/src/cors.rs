use crate::config::CONFIG;
use actix_cors::Cors;
use actix_web::http::header;

pub fn cors() -> actix_cors::Cors {
    let cors = Cors::default()
        .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
        .allowed_headers(vec![header::AUTHORIZATION, header::CONTENT_TYPE]);
    if CONFIG.profile == "debug" {
        cors.allowed_origin_fn(|origin, _req_head| {
            origin.as_bytes().starts_with(b"http://localhost")
        })
        .allowed_origin("https://sogrim.onrender.com")
    } else {
        cors.allowed_origin("https://sogrim.org")
            .allowed_origin("https://students.sogrim.org")
            .allowed_origin("https://sogrim.onrender.com")
    }
}
