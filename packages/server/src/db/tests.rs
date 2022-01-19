use crate::{
    api::students::get_all_catalogs, config::CONFIG, middleware, resources::catalog::DisplayCatalog,
};
use actix_rt::test;
use actix_web::{
    test::{self},
    web, App,
};
use dotenv::dotenv;
use mongodb::Client;

#[test]
pub async fn test_get_all_catalogs() {
    dotenv().ok();
    let client = Client::with_uri_str(CONFIG.uri)
        .await
        .expect("failed to connect");

    let app = test::init_service(
        App::new()
            .wrap(middleware::auth::AuthenticateMiddleware)
            .app_data(web::Data::new(client.clone()))
            .service(get_all_catalogs),
    )
    .await;

    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/catalogs")
        .insert_header(("authorization", "bugo-the-debugo"))
        .send_request(&app)
        .await;

    assert!(resp.status().is_success());

    // Check for valid json response
    let vec_catalogs: Vec<DisplayCatalog> = test::read_body_json(resp).await;
    assert_eq!(vec_catalogs[0].name, "2019-2020 מדמח תלת שנתי");
}
