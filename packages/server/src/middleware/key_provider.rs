use std::{
    future::Future,
    pin::Pin,
    sync::OnceLock,
    time::{Duration, Instant},
};

use actix_web::http::header;
use serde::Deserialize;

use crate::error::AppError;

const GOOGLE_CERT_URL: &str = "https://www.googleapis.com/oauth2/v3/certs";

type KeyId = String;
type RsaModulus = String;
type RsaExponent = String;
#[derive(Debug, Clone, Deserialize)]
pub struct RsaKey {
    pub kid: KeyId,
    pub n: RsaModulus,
    pub e: RsaExponent,
}
impl RsaKey {
    /// Returns the components of the RSA key.
    pub fn components(&self) -> (&RsaModulus, &RsaExponent) {
        (&self.n, &self.e)
    }
}

/// The output type of a future that returns the RSA keys and the expiration time of the cache.
type FetchResult = Result<(Vec<RsaKey>, Option<Duration>), AppError>;
/// The type above, as the output of a boxed future.
type FetchResultBoxedFuture = Box<dyn Future<Output = FetchResult>>;
/// The type of a function pointer that returns a thread-safe, pinned, version of the boxed future above.
pub type FetchFnPtr = Box<dyn Fn() -> Pin<FetchResultBoxedFuture> + Send>;

/// The type representing a key provider that fetches keys from Google.
pub struct GoogleKeyProvider {
    /// The RSA keys (usually 1 to 3 keys).
    pub keys: Vec<RsaKey>,
    /// The instant when the keys expire.
    pub expires_at: Option<Instant>,
    /// The function pointer to fetch the keys.
    pub fetch_fn_ptr: FetchFnPtr,
}

/// The static HTTP client.
pub static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

/// The response from Google's certs endpoint.
#[derive(Deserialize)]
struct GoogleCertResponse {
    keys: Vec<RsaKey>,
}

/// Fetches the RSA keys from Google.
async fn fetch_keys_from_google() -> FetchResult {
    // perfrom a GET request to the certs endpoint
    let resp = HTTP_CLIENT
        .get_or_init(reqwest::Client::new)
        .get(GOOGLE_CERT_URL)
        .send()
        .await?;

    // get the max age of the cache control header
    let max_age = resp
        .headers()
        .get(header::CACHE_CONTROL)
        .ok_or_else(|| AppError::GoogleKeyProvider("Missing cache control header".into()))?
        .to_str()
        .map_err(|e| AppError::GoogleKeyProvider(e.to_string()))?
        .split_terminator(',')
        .find_map(|s| s.trim().trim_start_matches("max-age=").parse::<u64>().ok())
        .map(Duration::from_secs);

    // deserialize the response
    let certs: GoogleCertResponse = resp.json().await?;
    Ok((certs.keys, max_age))
}

impl GoogleKeyProvider {
    /// Creates a new instance of the key provider.
    pub async fn new() -> Self {
        let mut provider = GoogleKeyProvider {
            keys: Vec::new(),
            expires_at: None,
            fetch_fn_ptr: Box::new(|| Box::pin(fetch_keys_from_google())),
        };
        provider
            .fetch()
            .await
            .expect("Failed to fetch public keys from Google");
        provider
    }

    /// Uses the function pointer to fetch the keys.
    async fn fetch(&mut self) -> Result<(), AppError> {
        let (keys, expiry_seconds) = (self.fetch_fn_ptr)().await?;
        self.keys = keys;
        self.expires_at = expiry_seconds.map(|secs| Instant::now() + secs);
        Ok(())
    }

    /// Gets the RSA key with the specified key ID (kid).
    pub async fn get_key(&mut self, kid: impl AsRef<str>) -> Result<&RsaKey, AppError> {
        if self.keys.is_empty() || self.expires_at.is_some_and(|at| at < Instant::now()) {
            self.fetch().await?;
        }
        self.keys
            .iter()
            .find(|key| key.kid == kid.as_ref())
            .ok_or_else(|| AppError::InternalServer(format!("Unknown key id: {}", kid.as_ref())))
    }

    #[cfg(test)]
    /// Creates a mock instance of the key provider, with the specified RSA key.
    /// Instead of performing an HTTP request to Google, it returns the specified key.
    pub fn mock(rsa_key: &'static RsaKey) -> Self {
        GoogleKeyProvider {
            keys: Vec::new(),
            expires_at: None,
            fetch_fn_ptr: Box::new(|| Box::pin(async { Ok((vec![rsa_key.clone()], None)) })),
        }
    }
}
