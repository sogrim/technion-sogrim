use std::{sync::OnceLock, time::SystemTime};

use crate::{
    config::CONFIG,
    db::Db,
    middleware::{self, jwt_decoder::JwtDecoder},
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
use base64::Engine;
use jsonwebtoken::{Algorithm, EncodingKey, Header};
use rand::thread_rng;
use rsa::{pkcs1::EncodeRsaPrivateKey, traits::PublicKeyParts, RsaPrivateKey};
use serde_json::json;

use super::key_provider::RsaKey;

/// Generate a fake RSA keypair for testing.
/// Well.. it's not really fake, it's just randomly generated and not stored anywhere.
/// Also, the key id is always "test".
static STATIC_KEYPAIR: OnceLock<(EncodingKey, RsaKey)> = OnceLock::new();
pub(crate) fn fake_rsa_keypair() -> &'static (EncodingKey, RsaKey) {
    if let Some(keypair) = STATIC_KEYPAIR.get() {
        return keypair;
    }
    let bits = 2048;
    let private_key = RsaPrivateKey::new(&mut thread_rng(), bits).unwrap();
    let key = EncodingKey::from_rsa_der(private_key.to_pkcs1_der().unwrap().as_bytes());
    let n = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(private_key.n().to_bytes_be());
    let e = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(private_key.e().to_bytes_be());
    STATIC_KEYPAIR.get_or_init(|| {
        (
            key,
            RsaKey {
                kid: String::from("test"),
                n,
                e,
            },
        )
    })
}

fn __fake_jwt(is_expired: bool) -> String {
    let (encoding_key, public_key) = fake_rsa_keypair();
    let exp = if is_expired {
        0
    } else {
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs()
            + 3600
    };
    let json = json!({
        "sub": "11112222333344445555",
        "aud": CONFIG.client_id,
        "iss": [
            "https://accounts.google.com",
            "accounts.google.com",
        ],
        "iat": 0,
        "exp": exp,
    });
    let mut header = Header::new(Algorithm::RS256);
    header.kid = Some(public_key.kid.clone());
    jsonwebtoken::encode(&header, &json, encoding_key).unwrap()
}

pub(crate) fn fake_jwt() -> String {
    __fake_jwt(false)
}
pub(crate) fn fake_jwt_expired() -> String {
    __fake_jwt(true)
}

#[test]
async fn test_from_request_no_db_client() {
    // Create authorization header
    let jwt = fake_jwt();
    let (_, public_key) = fake_rsa_keypair();
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(JwtDecoder::mock(public_key)))
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
    let expired_jwt = fake_jwt_expired();
    let (_, public_key) = fake_rsa_keypair();
    let app = test::init_service(
        App::new()
            .app_data(web::Data::new(JwtDecoder::mock(public_key)))
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
        String::from("Invalid JWT: InvalidToken"),
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
        String::from("Permission denied: Invalid JWT: ExpiredSignature"),
        resp_jwt_expired
            .response()
            .extensions()
            .get::<String>()
            .unwrap()
            .clone()
    );
}
