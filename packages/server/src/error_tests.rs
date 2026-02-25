use actix_web::http::StatusCode;

use super::*;

#[test]
fn response_error_maps_bad_request_and_body() {
    let response = AppError::BadRequest("bad".to_string()).error_response();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    assert_eq!(
        response.extensions().get::<String>().cloned(),
        Some("bad".to_string())
    );
}

#[test]
fn response_error_maps_unauthorized_and_prefixes_message() {
    let response = AppError::Unauthorized("denied".to_string()).error_response();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    assert_eq!(
        response.extensions().get::<String>().cloned(),
        Some("Permission denied: denied".to_string())
    );
}

#[test]
fn response_error_maps_mongo_driver_to_internal_server() {
    let response = AppError::MongoDriver("driver failed".to_string()).error_response();
    assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
    assert_eq!(
        response.extensions().get::<String>().cloned(),
        Some("MongoDB driver error: driver failed".to_string())
    );
}
