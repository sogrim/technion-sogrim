use crate::{
    db::Db,
    middleware,
    resources::user::{Permissions, User},
};
use actix_rt::test;
use actix_web::{
    http::StatusCode,
    test::{self},
    web::{self, Bytes},
    App,
};
use actix_web_lab::middleware::from_fn;

#[test]
async fn test_from_request_no_db_client() {
    // Create authorization header
    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (jwt, parser, _server) = jsonwebtoken_google::test_helper::setup(&token_claims);
    let app = test::init_service(
        App::new()
            .app_data(middleware::auth::JwtDecoder::new_with_parser(parser))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(
                web::resource("/").route(web::get().to(|_: User| async { "Shouldn't get here" })),
            ),
    )
    .await;

    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/")
        .insert_header(("authorization", jwt))
        .send_request(&app)
        .await;

    // Check for correct response (internal server error in this case)
    assert!(resp.status().is_server_error());
    assert_eq!(
        Bytes::from("Mongodb client not found in application data"),
        test::read_body(resp).await
    );
}

#[test]
async fn test_from_request_no_auth_mw() {
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(web::Data::new(Permissions::Student))
            .service(
                web::resource("/").route(web::get().to(|_: User| async { "Shouldn't get here" })),
            ),
    )
    .await;

    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/")
        .insert_header(("authorization", "bugo-the-debugo"))
        .send_request(&app)
        .await;

    // Check for correct response (internal server error in this case)
    assert!(resp.status().is_server_error());
    assert_eq!(
        Bytes::from("Middleware error: Sub not found in request extensions"),
        test::read_body(resp).await
    );
}

#[test]
async fn test_auth_mw_no_jwt_decoder() {
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(db.clone()))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(web::resource("/").route(web::get().to(|| async { "Shouldn't get here" }))),
    )
    .await;

    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/")
        .insert_header(("authorization", "bugo-the-debugo"))
        .send_request(&app)
        .await;

    // Check for correct response (internal server error in this case)
    assert!(resp.status().is_server_error());
    assert_eq!(
        String::from("JwtDecoder not initialized"),
        resp.response()
            .extensions()
            .get::<String>()
            .unwrap()
            .clone()
    );
}

#[test]
async fn test_auth_mw_client_errors() {
    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new_expired();
    let (expired_jwt, parser, _server) = jsonwebtoken_google::test_helper::setup(&token_claims);
    let app = test::init_service(
        App::new()
            .app_data(middleware::auth::JwtDecoder::new_with_parser(parser))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(web::resource("/").route(web::get().to(|| async { "Shouldn't get here" }))),
    )
    .await;

    // NO AUTH HEADER
    let resp_no_header = test::TestRequest::get().uri("/").send_request(&app).await;

    // Check for correct response (401 in this case)
    assert_eq!(resp_no_header.status(), StatusCode::UNAUTHORIZED);
    assert_eq!(
        String::from("No authorization header"),
        resp_no_header
            .response()
            .extensions()
            .get::<String>()
            .unwrap()
            .clone()
    );

    // INVALID JWT - WRONG HEADER
    let resp_bad_jwt = test::TestRequest::get()
        .uri("/")
        .insert_header(("authorization", "bad_jwt"))
        .send_request(&app)
        .await;

    // Check for correct response (401 in this case)
    assert_eq!(resp_bad_jwt.status(), StatusCode::UNAUTHORIZED);
    assert_eq!(
        String::from("Invalid JWT: Wrong header."),
        resp_bad_jwt
            .response()
            .extensions()
            .get::<String>()
            .unwrap()
            .clone()
    );

    // INVALID JWT - EXPIRED
    let resp_jwt_expired = test::TestRequest::get()
        .uri("/")
        .insert_header(("authorization", expired_jwt))
        .send_request(&app)
        .await;

    // Check for correct response (401 in this case)
    assert_eq!(resp_jwt_expired.status(), StatusCode::UNAUTHORIZED);
    assert_eq!(
        String::from("Invalid JWT: Wrong token format - ExpiredSignature."),
        resp_jwt_expired
            .response()
            .extensions()
            .get::<String>()
            .unwrap()
            .clone()
    );
}
