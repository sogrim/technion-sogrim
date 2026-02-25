use actix_web::{
    http::{
        header::{ACCESS_CONTROL_ALLOW_ORIGIN, ACCESS_CONTROL_REQUEST_METHOD, ORIGIN},
        Method,
    },
    test, web, App, HttpResponse,
};

use super::*;

#[actix_rt::test]
async fn cors_allows_localhost_origin_in_debug_profile() {
    let app = test::init_service(
        App::new()
            .wrap(cors())
            .service(web::resource("/").route(web::get().to(HttpResponse::Ok))),
    )
    .await;

    let resp = test::TestRequest::default()
        .method(Method::OPTIONS)
        .uri("/")
        .insert_header((ORIGIN, "http://localhost:5173"))
        .insert_header((ACCESS_CONTROL_REQUEST_METHOD, "GET"))
        .send_request(&app)
        .await;

    assert!(resp.headers().contains_key(ACCESS_CONTROL_ALLOW_ORIGIN));
}

#[actix_rt::test]
async fn cors_does_not_allow_non_localhost_origin_in_debug_profile() {
    let app = test::init_service(
        App::new()
            .wrap(cors())
            .service(web::resource("/").route(web::get().to(HttpResponse::Ok))),
    )
    .await;

    let resp = test::TestRequest::default()
        .method(Method::OPTIONS)
        .uri("/")
        .insert_header((ORIGIN, "https://example.com"))
        .insert_header((ACCESS_CONTROL_REQUEST_METHOD, "GET"))
        .send_request(&app)
        .await;

    assert!(!resp.headers().contains_key(ACCESS_CONTROL_ALLOW_ORIGIN));
}
