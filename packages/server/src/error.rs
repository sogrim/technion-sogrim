use actix_web::{HttpResponse, ResponseError};
use colored::Colorize;
use derive_more::Display;

#[derive(Debug, Display)]
pub enum AppError {
    BadRequest(String),     // 400
    Bson(String),           // 400
    Parser(String),         // 400
    NotFound(String),       // 404
    InternalServer(String), // 500
    Middleware(String),     // 500
    MongoDriver(String),    // 500
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let error;
        let resp = match self {
            AppError::BadRequest(e) => {
                error = e.to_owned();
                HttpResponse::BadRequest().body(error.clone())
            }
            AppError::Bson(e) => {
                error = format!("Bson error: {}", e);
                HttpResponse::BadRequest().body(error.clone())
            }
            AppError::Parser(e) => {
                error = format!("Parser error: {}", e);
                HttpResponse::BadRequest().body(error.clone())
            }
            AppError::NotFound(e) => {
                error = format!("{} not found", e);
                HttpResponse::NotFound().body(error.clone())
            }
            AppError::InternalServer(e) => {
                error = e.to_owned();
                HttpResponse::InternalServerError().body(error.clone())
            }
            AppError::Middleware(e) => {
                error = format!("Middleware error: {}", e);
                HttpResponse::InternalServerError().body(error.clone())
            }
            AppError::MongoDriver(e) => {
                error = format!("MongoDB driver error: {}", e);
                HttpResponse::InternalServerError().body(error.clone())
            }
        };
        log::error!("{}", error.bold().red());
        resp
    }
}
