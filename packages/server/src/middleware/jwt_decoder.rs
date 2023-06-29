use std::sync::Arc;

use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use tokio::sync::Mutex;

use crate::{config::CONFIG, error::AppError};

use super::key_provider::GoogleKeyProvider;

#[cfg(test)]
use super::key_provider::RsaKey;
#[cfg(test)]
use std::time::Duration;

pub type Sub = String;
#[derive(Default, Debug, Deserialize)]
pub struct Claims {
    // Identifier of the user, guaranteed to be unique by Google.
    pub sub: Sub,
}

#[derive(Clone)]
pub struct JwtDecoder {
    /// The decoder uses an external provider (API) for providing public keys from Google certs endpoint.
    /// The `JwtDecoder` is shared across actix worker threads, and the key provider requires mutable access because
    /// it needs to refetch keys from Google when they expire, and update the cache, which changes the internal state.
    /// Therefore, we must wrap the provider in an atomically-reference-counted (`Arc`) mutex.
    key_provider: Arc<Mutex<GoogleKeyProvider>>,
}

impl JwtDecoder {
    // Set up a jwt parser with actual google client id
    pub async fn new() -> Self {
        JwtDecoder {
            key_provider: Arc::new(Mutex::new(GoogleKeyProvider::new().await)),
        }
    }

    pub async fn decode(&self, jwt: &str) -> Result<Sub, AppError> {
        let mut provider = self.key_provider.lock().await;
        let kid = jsonwebtoken::decode_header(jwt)?
            .kid
            .ok_or_else(|| AppError::Middleware("Missing key id in JWT header".into()))?;
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

    #[cfg(test)]
    pub fn mock<'a: 'static>(rsa_key: &'a RsaKey, expires_at: &'a Option<Duration>) -> Self {
        JwtDecoder {
            key_provider: Arc::new(Mutex::new(GoogleKeyProvider::mock(rsa_key, expires_at))),
        }
    }
}
