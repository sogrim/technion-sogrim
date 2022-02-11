use crate::{
    api::students::get_all_catalogs,
    config::CONFIG,
    init_mongodb_client,
    middleware::{self, auth},
    resources::catalog::DisplayCatalog,
};
use actix_rt::test;
use actix_web::{
    test::{self},
    web::Data,
    App,
};
use actix_web_lab::middleware::from_fn;
use dotenv::dotenv;
use mongodb::Client;

#[test]
pub async fn test_get_all_catalogs() {
    // Create authorization header
    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (jwt, parser, _server) = jsonwebtoken_google::test_helper::setup(&token_claims);
    dotenv().ok();
    let client = init_mongodb_client!();
    let app = test::init_service(
        App::new()
            .app_data(Data::new(client.clone()))
            .app_data(auth::JwtDecoder::new_with_parser(parser))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(get_all_catalogs),
    )
    .await;

    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/catalogs")
        .insert_header(("authorization", jwt))
        .send_request(&app)
        .await;

    assert!(resp.status().is_success());

    // Check for valid json response
    let vec_catalogs: Vec<DisplayCatalog> = test::read_body_json(resp).await;
    assert_eq!(vec_catalogs[0].name, "מדמח תלת שנתי 2019-2020");
}
