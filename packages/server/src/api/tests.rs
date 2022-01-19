use crate::{api::students::login, config::CONFIG, middleware, resources::user::User};
use actix_rt::test;
use actix_web::{
    test::{self},
    web, App,
};
use dotenv::dotenv;
use mongodb::Client;

#[allow(clippy::float_cmp)]
#[test]
async fn test_user_login() {
    dotenv().ok();
    let client = Client::with_uri_str(CONFIG.uri)
        .await
        .expect("failed to connect");

    let app = test::init_service(
        App::new()
            .wrap(middleware::auth::AuthenticateMiddleware)
            .app_data(web::Data::new(client.clone()))
            .service(login),
    )
    .await;

    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/user/login")
        .insert_header(("authorization", "bugo-the-debugo"))
        .send_request(&app)
        .await;

    assert!(resp.status().is_success());

    // Check for valid json response
    let user: User = test::read_body_json(resp).await;
    assert_eq!(user.sub, "bugo-the-debugo");
    assert!(user.details.is_some());
}
