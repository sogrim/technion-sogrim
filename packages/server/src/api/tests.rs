use std::str::FromStr;

use crate::{
    api::{
        owners,
        students::{self, login},
    },
    core::{degree_status::DegreeStatus, messages},
    db::Db,
    middleware::{
        self, auth,
        jwt_decoder::JwtDecoder,
        tests::{fake_jwt, fake_rsa_keypair},
    },
    resources::{
        catalog::{Catalog, DisplayCatalog},
        course::{Course, CourseStatus},
        user::{Permissions, User, UserDetails},
    },
};
use axum::{
    body::Body,
    extract::Extension,
    http::{Method, Request, StatusCode},
    routing::{delete, get, post, put},
    Router,
};
use bson::oid::ObjectId;
use tower::ServiceExt;

use super::admins::{self, ComputeDegreeStatusPayload};

#[tokio::test]
pub async fn test_get_all_catalogs() {
    // Create authorization header
    let jwt = fake_jwt();
    let db = Db::new().await;
    let decoder = JwtDecoder::mock(&fake_rsa_keypair().1);
    let app = Router::new()
        .nest(
            "/students",
            Router::new().route("/catalogs", get(students::get_catalogs)),
        )
        .layer(axum::middleware::from_fn(middleware::auth::authenticate))
        .layer(Extension(Permissions::Student))
        .layer(Extension(db.clone()))
        .layer(Extension(decoder));

    // Create and send request
    let req = Request::builder()
        .method(Method::GET)
        .uri("/students/catalogs")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();

    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());

    // Check for valid json response
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let vec_catalogs: Vec<DisplayCatalog> = serde_json::from_slice(&body).unwrap();
    assert!(vec_catalogs.len() >= 8);
}

#[tokio::test]
async fn test_students_api_full_flow() {
    // Create authorization header
    let jwt = fake_jwt();
    // Init env and app
    let db = Db::new().await;
    let decoder = JwtDecoder::mock(&fake_rsa_keypair().1);
    let app = Router::new()
        .nest(
            "/students",
            Router::new()
                .route("/catalogs", get(students::get_catalogs))
                .route("/login", get(students::login))
                .route("/catalog", put(students::update_catalog))
                .route("/courses", post(students::add_courses))
                .route("/degree-status", get(students::compute_degree_status))
                .route("/details", put(students::update_details)),
        )
        .layer(axum::middleware::from_fn(middleware::auth::authenticate))
        .layer(Extension(Permissions::Student))
        .layer(Extension(db.clone()))
        .layer(Extension(decoder));

    // get /students/login
    let req = Request::builder()
        .method(Method::GET)
        .uri("/students/login")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let user: User = serde_json::from_slice(&body).unwrap();
    let mut user_details: UserDetails = user.details;

    // get /catalogs
    let req = Request::builder()
        .method(Method::GET)
        .uri("/students/catalogs")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let catalogs: Vec<DisplayCatalog> = serde_json::from_slice(&body).unwrap();

    // put /students/catalog
    let req = Request::builder()
        .method(Method::PUT)
        .uri("/students/catalog")
        .header("authorization", jwt.clone())
        .body(Body::from(catalogs[0].id.to_string()))
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());

    // post /students/courses
    let from_pdf = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v.txt")
        .expect("Something went wrong reading the file");
    let req = Request::builder()
        .method(Method::POST)
        .uri("/students/courses")
        .header("authorization", jwt.clone())
        .body(Body::from(from_pdf))
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());

    // get /students/degree-status
    let req = Request::builder()
        .method(Method::GET)
        .uri("/students/degree-status")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());

    // put /students/details
    user_details
        .degree_status
        .course_statuses
        .push(CourseStatus::default());
    let req = Request::builder()
        .method(Method::PUT)
        .uri("/students/details")
        .header("authorization", jwt.clone())
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::to_string(&user_details).expect("Fail to deserialize user details"),
        ))
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());
}

#[tokio::test]
async fn test_compute_in_progress() {
    // Init env and app
    let db = Db::new().await;
    let app = Router::new()
        .nest(
            "/students",
            Router::new()
                .route("/degree-status", get(students::compute_degree_status))
                .route("/details", put(students::update_details)),
        )
        .layer(Extension(Permissions::Student))
        .layer(Extension(db.clone()));

    let mut req = Request::builder()
        .method(Method::GET)
        .uri("/students/degree-status")
        .body(Body::empty())
        .unwrap();
    req.extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-senior".to_string());

    let resp = app.clone().oneshot(req).await.unwrap();
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let mut user: User = serde_json::from_slice(&body).unwrap();
    assert_eq!(user.details.degree_status.total_credit, 0.0);

    user.details.compute_in_progress = true;
    let mut req = Request::builder()
        .method(Method::PUT)
        .uri("/students/details")
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::to_string(&user.details).expect("Fail to deserialize user"),
        ))
        .unwrap();
    req.extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-senior".to_string());
    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    let mut req = Request::builder()
        .method(Method::GET)
        .uri("/students/degree-status")
        .body(Body::empty())
        .unwrap();
    req.extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-senior".to_string());

    let resp = app.clone().oneshot(req).await.unwrap();
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let mut user: User = serde_json::from_slice(&body).unwrap();
    assert_eq!(user.details.degree_status.total_credit, 2.5);

    user.details.compute_in_progress = false;
    let mut req = Request::builder()
        .method(Method::PUT)
        .uri("/students/details")
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::to_string(&user.details).expect("Fail to deserialize user"),
        ))
        .unwrap();
    req.extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-senior".to_string());
    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_owner_api_courses() {
    // Create authorization header
    let jwt = fake_jwt();
    // Init env and app
    let db = Db::new().await;
    let decoder = JwtDecoder::mock(&fake_rsa_keypair().1);
    let app = Router::new()
        .nest(
            "/owners",
            Router::new()
                .route("/courses", get(owners::get_all_courses))
                .route("/courses/{id}", get(owners::get_course_by_id))
                .route("/courses/{id}", put(owners::create_or_update_course))
                .route("/courses/{id}", delete(owners::delete_course)),
        )
        .layer(axum::middleware::from_fn(middleware::auth::authenticate))
        .layer(Extension(Permissions::Owner))
        .layer(Extension(db.clone()))
        .layer(Extension(decoder));

    // get /courses
    let req = Request::builder()
        .method(Method::GET)
        .uri("/owners/courses")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let courses: Vec<Course> = serde_json::from_slice(&body).unwrap();
    let mut course = courses[0].clone();

    // put /courses/{id}
    course.id = "some-id".into();
    let req = Request::builder()
        .method(Method::PUT)
        .uri(format!("/owners/courses/{}", course.id).as_str())
        .header("authorization", jwt.clone())
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::to_string(&course).expect("Fail to deserialize course"),
        ))
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());

    // get /courses/{id}
    let req = Request::builder()
        .method(Method::GET)
        .uri("/owners/courses/some-id")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let course_res: Course = serde_json::from_slice(&body).unwrap();
    assert_eq!(course_res.id, course.id);
    assert_eq!(course_res.name, course.name);
    assert_eq!(course_res.credit, course.credit);

    // delete /courses/{id}
    let req = Request::builder()
        .method(Method::DELETE)
        .uri("/owners/courses/some-id")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());

    // get /courses with 404 error
    let req = Request::builder()
        .method(Method::GET)
        .uri("/owners/courses/some-id")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_owner_api_catalogs() {
    // Create authorization header
    let jwt = fake_jwt();
    // Init env and app
    let db = Db::new().await;
    let decoder = JwtDecoder::mock(&fake_rsa_keypair().1);
    let app = Router::new()
        .nest(
            "/owners",
            Router::new().route("/catalogs/{id}", get(owners::get_catalog_by_id)),
        )
        .layer(axum::middleware::from_fn(middleware::auth::authenticate))
        .layer(Extension(Permissions::Owner))
        .layer(Extension(db.clone()))
        .layer(Extension(decoder));

    // get /catalog/{id}
    let req = Request::builder()
        .method(Method::GET)
        .uri("/owners/catalogs/61ddcc8a2397192f08d517d9")
        .header("authorization", jwt.clone())
        .body(Body::empty())
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_success());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let catalog: Catalog = serde_json::from_slice(&body).unwrap();
    assert_eq!(catalog.name, "מדמח הנדסת מחשבים 2018-2019");

    //TODO: create? delete?
}

#[tokio::test]
async fn test_student_login_no_sub() {
    // Init env and app
    let db = Db::new().await;
    let app = Router::new()
        .nest("/students", Router::new().route("/login", get(login)))
        .layer(Extension(db.clone()));

    // Create and send request
    let req = Request::builder()
        .method(Method::GET)
        .uri("/students/login")
        .body(Body::empty())
        .unwrap();

    let resp = app.clone().oneshot(req).await.unwrap();

    // Without auth middleware, the Sub extension is missing — axum rejects the request
    assert!(resp.status().is_server_error());
}

#[tokio::test]
async fn test_students_api_no_catalog() {
    // *** IMPORTANT: This should NEVER happen, but the tests are added anyway for coverage
    // Init env and app
    let db = Db::new().await;
    let app = Router::new()
        .nest(
            "/students",
            Router::new().route("/degree-status", get(students::compute_degree_status)),
        )
        .layer(Extension(Permissions::Student))
        .layer(Extension(db.clone()));

    let mut req = Request::builder()
        .method(Method::GET)
        .uri("/students/degree-status")
        .body(Body::empty())
        .unwrap();
    // Manually insert a sub of a fake user with no catalog
    req.extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-junior".to_string());

    let resp = app.clone().oneshot(req).await.unwrap();
    assert!(resp.status().is_server_error());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    assert_eq!(body, "No catalog chosen for user");
}

#[tokio::test]
async fn test_admins_parse_and_compute_api() {
    // Create authorization header
    let jwt = fake_jwt();
    // Init env and app
    let db = Db::new().await;
    let decoder = JwtDecoder::mock(&fake_rsa_keypair().1);
    let app = Router::new()
        .nest(
            "/admins",
            Router::new().route(
                "/parse-compute",
                post(admins::parse_courses_and_compute_degree_status),
            ),
        )
        .layer(axum::middleware::from_fn(middleware::auth::authenticate))
        .layer(Extension(Permissions::Admin))
        .layer(Extension(db.clone()))
        .layer(Extension(decoder));

    let copy_paste_data = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v_6.txt")
        .expect("Something went wrong reading the file");

    let req = Request::builder()
        .method(Method::POST)
        .uri("/admins/parse-compute")
        .header("authorization", jwt.clone())
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::to_string(&ComputeDegreeStatusPayload {
                catalog_id: ObjectId::from_str("61a102bb04c5400b98e6f401").unwrap(),
                grade_sheet_as_string: copy_paste_data,
            })
            .unwrap(),
        ))
        .unwrap();

    let resp = app.clone().oneshot(req).await.unwrap();
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    let degree_status: DegreeStatus = serde_json::from_slice(&body).unwrap();
    assert_eq!(degree_status.total_credit, 106.5);
    assert!(degree_status
        .overflow_msgs
        .contains(&messages::credit_leftovers_msg(0.0)))
}

#[tokio::test]
async fn test_unauthorized_path() {
    // Init env and app
    let db = Db::new().await;
    let app = Router::new()
        .nest(
            "/admins",
            Router::new().route(
                "/parse-compute",
                post(admins::parse_courses_and_compute_degree_status),
            ),
        )
        .layer(Extension(Permissions::Admin))
        .layer(Extension(db.clone()));

    // Create and send request
    let mut req = Request::builder()
        .method(Method::POST)
        .uri("/admins/parse-compute")
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::to_string(&ComputeDegreeStatusPayload {
                catalog_id: ObjectId::new(),
                grade_sheet_as_string: "".to_string(),
            })
            .unwrap(),
        ))
        .unwrap();
    // Manually insert a sub of a fake user with no permissions
    req.extensions_mut()
        .insert::<auth::Sub>("bugo-the-debugo-junior".to_string());

    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    assert_eq!(
        body,
        "Permission denied: User not authorized to access this resource"
    );
}
