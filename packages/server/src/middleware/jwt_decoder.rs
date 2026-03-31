use std::sync::Arc;

use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use tokio::sync::Mutex;

use crate::error::AppError;

use super::key_provider::GoogleKeyProvider;

#[cfg(test)]
use super::key_provider::RsaKey;

pub use sogrim_server::resources::user::Sub;

#[derive(Default, Debug, Deserialize)]
pub struct Jwt {
    // Identifier of the user, guaranteed to be unique by Google.
    pub sub: Sub,
}

#[derive(Clone)]
pub struct JwtDecoder {
    /// The decoder uses an external provider (API) for providing public keys from Google certs endpoint.
    /// The `JwtDecoder` is shared across async tasks, and the key provider requires mutable access because
    /// it needs to refetch keys from Google when they expire, and update the cache, which changes the internal state.
    /// Therefore, we must wrap the provider in an atomically-reference-counted (`Arc`) mutex.
    key_provider: Arc<Mutex<GoogleKeyProvider>>,
    client_id: String,
}

impl JwtDecoder {
    pub async fn new(client_id: String) -> Self {
        JwtDecoder {
            key_provider: Arc::new(Mutex::new(GoogleKeyProvider::new().await)),
            client_id,
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
        validation.set_audience(std::slice::from_ref(&self.client_id));
        validation.set_issuer(&[
            "https://accounts.google.com".to_string(),
            "accounts.google.com".to_string(),
        ]);
        let data = jsonwebtoken::decode::<Jwt>(jwt, &decoding_key, &validation)?;
        Ok(data.claims.sub)
    }

    #[cfg(test)]
    pub fn mock(rsa_key: &'static RsaKey, client_id: &str) -> Self {
        JwtDecoder {
            key_provider: Arc::new(Mutex::new(GoogleKeyProvider::mock(rsa_key))),
            client_id: client_id.to_owned(),
        }
    }
}
