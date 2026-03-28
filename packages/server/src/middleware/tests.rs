use std::{sync::OnceLock, time::SystemTime};

use crate::{
    config::CONFIG,
    db::Db,
    middleware::{self, jwt_decoder::JwtDecoder},
    resources::user::{Permissions, User},
};
use axum::{
    body::Body,
    extract::Extension,
    http::{Method, Request, StatusCode},
    routing::get,
    Router,
};
use base64::Engine;
use jsonwebtoken::{Algorithm, EncodingKey, Header};
use rsa::{pkcs1::EncodeRsaPrivateKey, traits::PublicKeyParts, RsaPrivateKey};
use serde_json::json;
use tower::ServiceExt;

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
    let private_key = RsaPrivateKey::new(&mut rand::rng(), bits).unwrap();
    let key = EncodingKey::from_rsa_der(private_key.to_pkcs1_der().unwrap().as_bytes());
    let n_bytes = private_key.n().as_ref().to_be_bytes();
    let n_trimmed = n_bytes
        .iter()
        .copied()
        .skip_while(|&b| b == 0)
        .collect::<Vec<_>>();
    let n = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&n_trimmed);
    let e_bytes = private_key.e().to_be_bytes();
    let e_trimmed = e_bytes
        .iter()
        .copied()
        .skip_while(|&b| b == 0)
        .collect::<Vec<_>>();
    let e = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(&e_trimmed);
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

fn make_fake_jwt(is_expired: bool) -> String {
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
    make_fake_jwt(false)
}
pub(crate) fn fake_jwt_expired() -> String {
    make_fake_jwt(true)
}

#[tokio::test]
async fn test_from_request_no_db_client() {
    // Create authorization header
    let jwt = fake_jwt();
    let (_, public_key) = fake_rsa_keypair();
    let decoder = JwtDecoder::mock(public_key);
    let app = Router::new()
        .route("/", get(|_: User| async { "Shouldn't get here" }))
        .layer(axum::middleware::from_fn(middleware::auth::authenticate))
        .layer(Extension(decoder));

    // Create and send request
    let req = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header("authorization", jwt)
        .body(Body::empty())
        .unwrap();

    let resp = app.clone().oneshot(req).await.unwrap();

    // Check for correct response (internal server error in this case)
    assert!(resp.status().is_server_error());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    assert_eq!(body, "Mongodb client not found in application data");
}

#[tokio::test]
async fn test_from_request_no_auth_mw() {
    let db = Db::new().await;
    let app = Router::new()
        .route("/", get(|_: User| async { "Shouldn't get here" }))
        .layer(Extension(Permissions::Student))
        .layer(Extension(db.clone()));

    // Create and send request
    let req = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header("authorization", "bugo-the-debugo")
        .body(Body::empty())
        .unwrap();

    let resp = app.clone().oneshot(req).await.unwrap();

    // Check for correct response (internal server error in this case)
    assert!(resp.status().is_server_error());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    assert_eq!(
        body,
        "Middleware error: Sub not found in request extensions"
    );
}

#[tokio::test]
async fn test_auth_mw_no_jwt_decoder() {
    let db = Db::new().await;
    let app = Router::new()
        .route("/", get(|| async { "Shouldn't get here" }))
        .layer(axum::middleware::from_fn(middleware::auth::authenticate))
        .layer(Extension(db.clone()));

    // Create and send request
    let req = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header("authorization", "bugo-the-debugo")
        .body(Body::empty())
        .unwrap();

    let resp = app.clone().oneshot(req).await.unwrap();

    // Check for correct response (internal server error in this case)
    assert!(resp.status().is_server_error());
    let body = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .unwrap();
    assert_eq!(body, "JwtDecoder not initialized");
}

#[tokio::test]
async fn test_auth_mw_client_errors() {
    let expired_jwt = fake_jwt_expired();
    let (_, public_key) = fake_rsa_keypair();
    let decoder = JwtDecoder::mock(public_key);
    let app = Router::new()
        .route("/", get(|| async { "Shouldn't get here" }))
        .layer(axum::middleware::from_fn(middleware::auth::authenticate))
        .layer(Extension(decoder));

    // NO AUTH HEADER
    let req_no_header = Request::builder()
        .method(Method::GET)
        .uri("/")
        .body(Body::empty())
        .unwrap();
    let resp_no_header = app.clone().oneshot(req_no_header).await.unwrap();

    // Check for correct response (401 in this case)
    assert_eq!(resp_no_header.status(), StatusCode::UNAUTHORIZED);
    let body = axum::body::to_bytes(resp_no_header.into_body(), usize::MAX)
        .await
        .unwrap();
    assert_eq!(body, "No authorization header");

    // INVALID JWT - WRONG HEADER
    let req_bad_jwt = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header("authorization", "bad_jwt")
        .body(Body::empty())
        .unwrap();
    let resp_bad_jwt = app.clone().oneshot(req_bad_jwt).await.unwrap();

    // Check for correct response (401 in this case)
    assert_eq!(resp_bad_jwt.status(), StatusCode::UNAUTHORIZED);
    let body = axum::body::to_bytes(resp_bad_jwt.into_body(), usize::MAX)
        .await
        .unwrap();
    assert_eq!(body, "Invalid JWT: InvalidToken");

    // INVALID JWT - EXPIRED
    let req_jwt_expired = Request::builder()
        .method(Method::GET)
        .uri("/")
        .header("authorization", expired_jwt)
        .body(Body::empty())
        .unwrap();
    let resp_jwt_expired = app.clone().oneshot(req_jwt_expired).await.unwrap();

    // Check for correct response (401 in this case)
    assert_eq!(resp_jwt_expired.status(), StatusCode::UNAUTHORIZED);
    let body = axum::body::to_bytes(resp_jwt_expired.into_body(), usize::MAX)
        .await
        .unwrap();
    assert_eq!(body, "Permission denied: Invalid JWT: ExpiredSignature");
}
