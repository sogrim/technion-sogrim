use std::sync::Arc;

use async_trait::async_trait;
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use tokio::sync::Mutex;

use crate::{config::CONFIG, error::AppError};

use super::key_provider::GoogleKeyProvider;

pub type Sub = String;
#[derive(Default, Debug, Deserialize)]
pub struct Claims {
    // Identifier of the user, guaranteed to be unique by Google.
    pub sub: Sub,
}

#[async_trait] // TODO: remove async_trait when async fn in trait becomes stable (~1.74?)
pub trait Decoder {
    async fn decode(&self, jwt: &str) -> Result<Sub, AppError>;
}

#[derive(Debug, Clone)]
pub struct JwtDecoder {
    /// The decoder uses an external provider (API) for providing public keys from Google certs endpoint.
    /// The `JwtDecoder` is shared across actix worker threads, and the key provider requires mutable access because
    /// it needs to refetch keys from Google when they expire.
    /// Therefore, we must wrap the provider in an atomically-reference-counted (`Arc`) mutex.
    key_provider: Arc<Mutex<GoogleKeyProvider>>,
}

pub struct MockJwtDecoder {
    fake_jwt: &'static str,
}

impl JwtDecoder {
    // Set up a jwt parser with actual google client id
    pub async fn new() -> Self {
        JwtDecoder {
            key_provider: Arc::new(Mutex::new(GoogleKeyProvider::new().await)),
        }
    }

    #[cfg(test)]
    pub fn mock(fake_jwt: &'static str) -> MockJwtDecoder {
        MockJwtDecoder { fake_jwt }
    }
}

#[async_trait] // TODO: remove async_trait when async fn in trait becomes stable (~1.74?)
impl Decoder for JwtDecoder {
    async fn decode(&self, jwt: &str) -> Result<Sub, AppError> {
        let mut provider = self.key_provider.lock().await;
        let header = jsonwebtoken::decode_header(jwt)?;
        let kid = header.kid.unwrap_or_default();
        let key = provider.get_key(kid).await?;
        let (n, e) = key.components();
        let decoding_key = DecodingKey::from_rsa_components(n, e)?;
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_audience(&[CONFIG.client_id.to_owned()]);
        validation.set_issuer(&[
            "https://accounts.google.com".to_string(),
            "accounts.google.com".to_string(),
        ]);
        let data = jsonwebtoken::decode::<Claims>(jwt, &decoding_key, &validation)?;
        Ok(data.claims.sub)
    }
}

#[async_trait] // TODO: remove async_trait when async fn in trait becomes stable (~1.74?)
impl Decoder for MockJwtDecoder {
    async fn decode(&self, jwt: &str) -> Result<Sub, AppError> {
        if jwt == self.fake_jwt {
            Ok(String::new())
        } else {
            Err(AppError::Middleware(String::new()))
        }
    }
}
