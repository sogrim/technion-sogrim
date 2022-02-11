use crate::{config::CONFIG, init_mongodb_client, middleware, resources::user::User};
use actix_rt::test;
use actix_web::{
    test::{self},
    web::{self, Bytes},
    App,
};
use actix_web_lab::middleware::from_fn;
use dotenv::dotenv;
use mongodb::Client;

#[test]
async fn test_from_request_no_db_client() {
    //Init env and app
    dotenv().ok();
    let app = test::init_service(
        App::new()
            .wrap(from_fn(middleware::auth::authenticate))
            .service(
                web::resource("/").route(web::get().to(|_: User| async { "Shouldn't get here" })),
            ),
    )
    .await;

    // Create authorization header

    let claims1 = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (token1, parser1, _server) = jsonwebtoken_google::test_helper::setup(&claims1);
    let result1 = parser1
        .parse::<jsonwebtoken_google::test_helper::TokenClaims>(token1.as_str())
        .await;

    let claims2 = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (_, parser2, _server) = jsonwebtoken_google::test_helper::setup(&claims2);
    let result2 = parser2
        .parse::<jsonwebtoken_google::test_helper::TokenClaims>(token1.as_str())
        .await;

    result1.expect("unwrap 1");
    result2.expect("unwrap 2");

    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new();
    let jwt = jsonwebtoken_google::test_helper::setup(&token_claims).0;
    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/")
        .insert_header(("authorization", jwt))
        .send_request(&app)
        .await;

    // Check for correct response (internal server error in this case)
    //assert!(resp.status().is_server_error());
    assert_eq!(
        Bytes::from("Mongodb client not found in application data"),
        test::read_body(resp).await
    );
}

#[test]
async fn test_from_request_no_auth_mw() {
    //Init env and app
    dotenv().ok();
    let client = init_mongodb_client!();
    let app = test::init_service(App::new().app_data(web::Data::new(client.clone())).service(
        web::resource("/").route(web::get().to(|_: User| async { "Shouldn't get here" })),
    ))
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
        Bytes::from("Middleware Error: Sub not found in request extensions"),
        test::read_body(resp).await
    );
}

#[test]
async fn test_auth_mw() {
    //Init env and app
    dotenv().ok();
    let client = init_mongodb_client!();
    let app = test::init_service(App::new().app_data(web::Data::new(client.clone())).service(
        web::resource("/").route(web::get().to(|_: User| async { "Shouldn't get here" })),
    ))
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
        Bytes::from("Middleware Error: Sub not found in request extensions"),
        test::read_body(resp).await
    );
}
