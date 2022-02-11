use crate::{
    api::students::login, config::CONFIG, init_mongodb_client, middleware, resources::user::User,
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

#[allow(clippy::float_cmp)]
#[test]
async fn test_student_login() {
    dotenv().ok();
    let client = init_mongodb_client!();

    let app = test::init_service(
        App::new()
            .wrap(from_fn(middleware::auth::authenticate))
            .app_data(Data::new(client.clone()))
            .service(login),
    )
    .await;

    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/students/login")
        .insert_header(("authorization", "bugo-the-debugo"))
        .send_request(&app)
        .await;

    assert!(resp.status().is_success());

    // Check for valid json response
    let user: User = test::read_body_json(resp).await;
    assert_eq!(user.sub, "bugo-the-debugo");
    assert!(user.details.is_some());
}
