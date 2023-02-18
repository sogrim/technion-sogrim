use std::str::FromStr;

use crate::{
    api::{
        bo,
        students::{self, login},
    },
    core::{degree_status::DegreeStatus, messages},
    db::Db,
    middleware::{self, auth},
    resources::{
        catalog::{Catalog, DisplayCatalog},
        course::{Course, CourseStatus},
        user::{User, UserDetails},
    },
};
use actix_rt::test;
use actix_web::{
    http::StatusCode,
    test::{self},
    web::{Bytes, Data},
    App, HttpMessage,
};
use actix_web_lab::middleware::from_fn;
use bson::oid::ObjectId;
use dotenvy::dotenv;

use super::admins::{self, ComputeDegreeStatusPayload};

#[test]
pub async fn test_get_all_catalogs() {
    // Create authorization header
    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (jwt, parser, _server) = jsonwebtoken_google::test_helper::setup(&token_claims);
    dotenv().ok();
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(Data::new(db.clone()))
            .app_data(auth::JwtDecoder::new_with_parser(parser))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(students::get_catalogs),
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
    assert!(vec_catalogs.len() >= 8);
}

#[test]
async fn test_students_api_full_flow() {
    dotenv().ok();
    // Create authorization header

    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (jwt, parser, _server) = jsonwebtoken_google::test_helper::setup(&token_claims);
    // Init env and app
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(Data::new(db.clone()))
            .app_data(auth::JwtDecoder::new_with_parser(parser))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(students::get_catalogs)
            .service(students::login)
            .service(students::update_catalog)
            .service(students::add_courses)
            .service(students::compute_degree_status)
            .service(students::update_details),
    )
    .await;

    // let mut responses = Vec::new();
    // get /students/login
    let mut res = test::TestRequest::get()
        .uri("/students/login")
        .insert_header(("authorization", jwt.clone()))
        .send_request(&app)
        .await;
    assert!(res.status().is_success());
    let user: User = test::read_body_json(res).await;
    let mut user_details: UserDetails = user.details;

    // get /catalogs
    res = test::TestRequest::get()
        .uri("/catalogs")
        .insert_header(("authorization", jwt.clone()))
        .send_request(&app)
        .await;
    assert!(res.status().is_success());
    let catalogs: Vec<DisplayCatalog> = test::read_body_json(res).await;

    // put /students/catalog
    res = test::TestRequest::put()
        .uri("/students/catalog")
        .insert_header(("authorization", jwt.clone()))
        .set_payload(catalogs[0].id.to_string())
        .send_request(&app)
        .await;
    assert!(res.status().is_success());

    // post /students/courses
    let from_pdf = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v.txt")
        .expect("Something went wrong reading the file");
    res = test::TestRequest::post()
        .uri("/students/courses")
        .insert_header(("authorization", jwt.clone()))
        .set_payload(from_pdf)
        .send_request(&app)
        .await;
    assert!(res.status().is_success());

    // get /students/degree-status
    res = test::TestRequest::get()
        .uri("/students/degree-status")
        .insert_header(("authorization", jwt.clone()))
        .send_request(&app)
        .await;
    assert!(res.status().is_success());

    // put /students/details"
    user_details
        .degree_status
        .course_statuses
        .push(CourseStatus::default());
    res = test::TestRequest::put()
        .uri("/students/details")
        .insert_header(("authorization", jwt.clone()))
        .insert_header(("content-type", "application/json"))
        .set_payload(
            serde_json::to_string(&user_details).expect("Fail to deserialize user details"),
        )
        .send_request(&app)
        .await;
    assert!(res.status().is_success());
}
#[test]
async fn test_compute_in_progress() {
    dotenv().ok();

    // Init env and app
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(Data::new(db.clone()))
            .service(students::compute_degree_status)
            .service(students::update_details),
    )
    .await;

    let get_degree_status_before = test::TestRequest::get()
        .uri("/students/degree-status")
        .to_request();
    get_degree_status_before
        .extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-senior".to_string());

    let res = test::call_service(&app, get_degree_status_before).await;
    let mut user: User = test::read_body_json(res).await;
    assert_eq!(user.details.degree_status.total_credit, 0.0);

    user.details.compute_in_progress = true;
    let put_user_details = test::TestRequest::put()
        .uri("/students/details")
        .insert_header(("content-type", "application/json"))
        .set_payload(serde_json::to_string(&user.details).expect("Fail to deserialize user"))
        .to_request();
    put_user_details
        .extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-senior".to_string());
    let res = test::call_service(&app, put_user_details).await;
    assert_eq!(res.status(), StatusCode::OK);

    let get_degree_status_after = test::TestRequest::get()
        .uri("/students/degree-status")
        .to_request();
    get_degree_status_after
        .extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-senior".to_string());

    let res = test::call_service(&app, get_degree_status_after).await;
    let mut user: User = test::read_body_json(res).await;
    assert_eq!(user.details.degree_status.total_credit, 2.5);

    user.details.compute_in_progress = false;
    let put_user_details = test::TestRequest::put()
        .uri("/students/details")
        .insert_header(("content-type", "application/json"))
        .set_payload(serde_json::to_string(&user.details).expect("Fail to deserialize user"))
        .to_request();
    put_user_details
        .extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-senior".to_string());
    let res = test::call_service(&app, put_user_details).await;
    assert_eq!(res.status(), StatusCode::OK);
}

#[test]
async fn test_bo_api_courses() {
    dotenv().ok();
    // Create authorization header
    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (jwt, parser, _server) = jsonwebtoken_google::test_helper::setup(&token_claims);
    // Init env and app
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(Data::new(db.clone()))
            .app_data(auth::JwtDecoder::new_with_parser(parser))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(bo::get_all_courses)
            .service(bo::get_course_by_id)
            .service(bo::create_or_update_course)
            .service(bo::delete_course),
    )
    .await;

    // get /courses
    let res = test::TestRequest::get()
        .uri("/courses")
        .insert_header(("authorization", jwt.clone()))
        .send_request(&app)
        .await;
    assert!(res.status().is_success());
    let courses: Vec<Course> = test::read_body_json(res).await;
    let mut course = courses[0].clone();

    // put /courses/{id}
    course.id = "some-id".into();
    let res = test::TestRequest::put()
        .uri(format!("/courses/{}", course.id).as_str())
        .insert_header(("authorization", jwt.clone()))
        .insert_header(("content-type", "application/json"))
        .set_payload(serde_json::to_string(&course).expect("Fail to deserialize course"))
        .send_request(&app)
        .await;
    assert!(res.status().is_success());

    // get /courses/{id}
    let res = test::TestRequest::get()
        .uri("/courses/some-id")
        .insert_header(("authorization", jwt.clone()))
        .send_request(&app)
        .await;
    assert!(res.status().is_success());
    let course_res: Course = test::read_body_json(res).await;
    assert_eq!(course_res.id, course.id);
    assert_eq!(course_res.name, course.name);
    assert_eq!(course_res.credit, course.credit);

    // delete /courses/{id}
    let res = test::TestRequest::delete()
        .uri("/courses/some-id")
        .insert_header(("authorization", jwt.clone()))
        .send_request(&app)
        .await;
    assert!(res.status().is_success());

    // get /courses with 404 error
    let res = test::TestRequest::get()
        .uri("/courses/some-id")
        .insert_header(("authorization", jwt.clone()))
        .send_request(&app)
        .await;
    assert_eq!(res.status(), StatusCode::NOT_FOUND);
}

#[test]
async fn test_bo_api_catalogs() {
    dotenv().ok();
    // Create authorization header
    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (jwt, parser, _server) = jsonwebtoken_google::test_helper::setup(&token_claims);
    // Init env and app
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(Data::new(db.clone()))
            .app_data(auth::JwtDecoder::new_with_parser(parser))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(bo::get_catalog_by_id),
    )
    .await;

    // get /catalog/{id}
    let res = test::TestRequest::get()
        .uri("/catalogs/61ddcc8a2397192f08d517d9")
        .insert_header(("authorization", jwt.clone()))
        .send_request(&app)
        .await;
    assert!(res.status().is_success());
    let catalog: Catalog = test::read_body_json(res).await;
    assert_eq!(catalog.name, "מדמח הנדסת מחשבים 2018-2019");

    //TODO: create? delete?
}

#[test]
async fn test_student_login_no_sub() {
    dotenv().ok();
    // Init env and app
    let db = Db::new().await;
    let app = test::init_service(App::new().app_data(Data::new(db.clone())).service(login)).await;

    // Create and send request
    let resp = test::TestRequest::get()
        .uri("/students/login")
        .send_request(&app)
        .await;

    assert!(resp.status().is_server_error());
    assert_eq!(
        Bytes::from("Middleware error: No sub found in request extensions"),
        test::read_body(resp).await
    );
}

#[test]
async fn test_students_api_no_catalog() {
    // *** IMPORTANT: This should NEVER happen, but the tests are added anyway for coverage
    dotenv().ok();
    // Init env and app
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(Data::new(db.clone()))
            .service(students::compute_degree_status),
    )
    .await;
    let request = test::TestRequest::get()
        .uri("/students/degree-status")
        .to_request();

    // Manually insert a sub of a fake user with no catalog
    request
        .extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-junior".to_string());
    let resp = test::call_service(&app, request).await;
    assert!(resp.status().is_server_error());
    assert_eq!(
        Bytes::from("No catalog chosen for user"),
        test::read_body(resp).await
    );
}

#[test]
async fn test_admins_parse_and_compute_api() {
    dotenv().ok();
    // Create authorization header
    let token_claims = jsonwebtoken_google::test_helper::TokenClaims::new();
    let (jwt, parser, _server) = jsonwebtoken_google::test_helper::setup(&token_claims);
    // Init env and app
    let db = Db::new().await;
    let app = test::init_service(
        App::new()
            .app_data(Data::new(db.clone()))
            .app_data(auth::JwtDecoder::new_with_parser(parser))
            .wrap(from_fn(middleware::auth::authenticate))
            .service(admins::parse_courses_and_compute_degree_status),
    )
    .await;

    let copy_paste_data = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v_6.txt")
        .expect("Something went wrong reading the file");

    let post_admins_compute = test::TestRequest::post()
        .uri("/admins/compute")
        .insert_header(("authorization", jwt.clone()))
        .set_json(ComputeDegreeStatusPayload {
            catalog_id: ObjectId::from_str("61a102bb04c5400b98e6f401").unwrap(),
            grade_sheet_as_string: copy_paste_data,
        })
        .to_request();

    let resp = test::call_service(&app, post_admins_compute).await;

    let degree_status: DegreeStatus = test::read_body_json(resp).await;
    assert_eq!(degree_status.total_credit, 106.5);
    assert!(degree_status
        .overflow_msgs
        .contains(&messages::credit_leftovers_msg(0.0)))
}
