use crate::{
    config::CONFIG,
    db::{Db, FilterOption},
    resources::course::Course,
};
use actix_rt::test;
use actix_web::{body::MessageBody, http::StatusCode, ResponseError};

use dotenvy::dotenv;
use mongodb::{
    options::{ClientOptions, Credential},
    Client,
};

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

    // Initialize db
    let db = Db::from(client);

    // Assert that all db requests cause an internal server error
    let errors = vec![
        db.get::<Course>("124400")
            .await
            .expect_err("Expected error"),
        db.get_all::<Course>().await.expect_err("Expected error"),
        db.update::<Course>(Course {
            id: "124400".into(),
            ..Default::default()
        })
        .await
        .expect_err("Expected error"),
        db.delete::<Course>("124400")
            .await
            .expect_err("Expected error"),
    ];
    for err in errors {
        let err_resp = err.error_response();
        assert_eq!(err_resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
        assert!(err_resp
            .into_body()
            .try_into_bytes()
            .unwrap()
            .into_iter()
            .map(|b| b as char)
            .collect::<String>()
            .contains("Authentication failed"));
    }
}

#[test]
pub async fn test_get_courses_by_filters() {
    dotenv().ok();

    let db = Db::new().await;

    let courses = db
        .get_filtered::<Course>(FilterOption::Regex, "name", "חשבון אינפיניטסימלי 1מ'")
        .await
        .expect("Failed to get courses by name");

    assert_eq!(courses.len(), 1);
    assert_eq!(courses[0].name, "חשבון אינפיניטסימלי 1מ'");
    assert_eq!(courses[0].id, "104031");

    let courses = db
        .get_filtered::<Course>(FilterOption::Regex, "_id", "104031")
        .await
        .expect("Failed to get courses by number");

    assert_eq!(courses.len(), 1);
    assert_eq!(courses[0].name, "חשבון אינפיניטסימלי 1מ'");
    assert_eq!(courses[0].id, "104031");

    let courses = db
        .get_filtered::<Course>(FilterOption::In, "_id", vec!["104031", "104166"])
        .await
        .expect("Failed to get courses by number");

    assert_eq!(courses.len(), 2);
    assert_eq!(courses[0].name, "חשבון אינפיניטסימלי 1מ'");
    assert_eq!(courses[0].id, "104031");
    assert_eq!(courses[1].name, "אלגברה אמ'");
    assert_eq!(courses[1].id, "104166");
}
