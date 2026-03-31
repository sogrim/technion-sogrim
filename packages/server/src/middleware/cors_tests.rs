use axum::{routing::get, Router};
use http::{
    header::{ACCESS_CONTROL_ALLOW_ORIGIN, ACCESS_CONTROL_REQUEST_METHOD, ORIGIN},
    Method, Request, StatusCode,
};
use tower::ServiceExt;

use super::*;

#[tokio::test]
async fn cors_allows_localhost_origin_in_debug_profile() {
    let app = Router::new()
        .route("/", get(|| async { StatusCode::OK }))
        .layer(cors(true));

    let req = Request::builder()
        .method(Method::OPTIONS)
        .uri("/")
        .header(ORIGIN, "http://localhost:5173")
        .header(ACCESS_CONTROL_REQUEST_METHOD, "GET")
        .body(axum::body::Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();
    assert!(resp.headers().contains_key(ACCESS_CONTROL_ALLOW_ORIGIN));
}

#[tokio::test]
async fn cors_does_not_allow_non_localhost_origin_in_debug_profile() {
    let app = Router::new()
        .route("/", get(|| async { StatusCode::OK }))
        .layer(cors(true));

    let req = Request::builder()
        .method(Method::OPTIONS)
        .uri("/")
        .header(ORIGIN, "https://example.com")
        .header(ACCESS_CONTROL_REQUEST_METHOD, "GET")
        .body(axum::body::Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();
    assert!(!resp.headers().contains_key(ACCESS_CONTROL_ALLOW_ORIGIN));
}
