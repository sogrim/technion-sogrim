use crate::{config::CONFIG, db, init_mongodb_client};
use actix_rt::test;
use actix_web::{body::MessageBody, http::StatusCode, web::Bytes, ResponseError};

use dotenv::dotenv;
use mongodb::{
    options::{ClientOptions, Credential},
    Client,
};

use super::services;

#[test]
pub async fn test_db_internal_error() {
    dotenv().ok();
    // Create explicit client options and update it manually
    let mut client_options = ClientOptions::parse(CONFIG.uri)
        .await
        .expect("Failed to parse client options");

    // Create a fake credential to make queries fail to authenticate
    let credential = Credential::builder()
        .username(Some("unknown-username".into()))
        .password(Some("unknown-password".into()))
        .build();
    client_options.credential = Some(credential);

    // Create mongodb client
    let client = Client::with_options(client_options).expect("Failed to create client");

    // Assert that all db requests cause an internal server error
    let errors = vec![
        services::get_course_by_id("124400", &client)
            .await
            .expect_err("Expected error"),
        services::get_all_courses(&client)
            .await
            .expect_err("Expected error"),
        services::find_and_update_course("124400", bson::doc! {"$setOnInsert": {}}, &client)
            .await
            .expect_err("Expected error"),
        services::delete_course("124400", &client)
            .await
            .expect_err("Expected error"),
    ];
    for err in errors {
        let err_resp = err.error_response();
        assert_eq!(err_resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(
            err_resp.into_body().try_into_bytes().unwrap(),
            Bytes::from("MongoDB driver error: SCRAM failure: bad auth : Authentication failed.")
        );
    }
}

#[test]
pub async fn test_get_courses_by_filters() {
    dotenv().ok();

    let client = init_mongodb_client!();

    let courses = db::services::get_courses_filtered_by_name("חשבון אינפיניטסימלי 1מ'", &client)
        .await
        .expect("Failed to get courses by name");

    assert_eq!(courses.len(), 1);
    assert_eq!(courses[0].name, "חשבון אינפיניטסימלי 1מ'");
    assert_eq!(courses[0].id, "104031");

    let courses = db::services::get_courses_filtered_by_number("104031", &client)
        .await
        .expect("Failed to get courses by number");

    assert_eq!(courses.len(), 1);
    assert_eq!(courses[0].name, "חשבון אינפיניטסימלי 1מ'");
    assert_eq!(courses[0].id, "104031");

    let courses = db::services::get_courses_by_ids(vec!["104031", "104166"], &client)
        .await
        .expect("Failed to get courses by number");

    assert_eq!(courses.len(), 2);
    assert_eq!(courses[0].name, "חשבון אינפיניטסימלי 1מ'");
    assert_eq!(courses[0].id, "104031");
    assert_eq!(courses[1].name, "אלגברה אמ'");
    assert_eq!(courses[1].id, "104166");
}
