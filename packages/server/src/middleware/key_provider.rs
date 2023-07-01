use std::{
    collections::HashMap,
    future::Future,
    pin::Pin,
    sync::OnceLock,
    time::{Duration, Instant},
};

use actix_web::http::header;
use reqwest::Response;
use serde::Deserialize;

use crate::error::AppError;

const GOOGLE_CERT_URL: &str = "https://www.googleapis.com/oauth2/v3/certs";

/// Returns the maximum age of the cache control header in the response.
fn get_max_age(res: &Response) -> Option<Duration> {
    res.headers()
        .get(header::CACHE_CONTROL)?
        .to_str()
        .ok()?
        .split_terminator(',')
        .find_map(|s| s.trim().trim_start_matches("max-age=").parse::<u64>().ok())
        .map(Duration::from_secs)
}

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
type FutureOutput = Result<(Vec<RsaKey>, Option<Duration>), AppError>;
/// The type above, as the output of a boxed future.
type BoxedResultFuture = Box<dyn Future<Output = FutureOutput>>;
/// The type of a function pointer that returns the a thread-safe, pinned, version of the boxed future above. Full type: <br>
/// `Box<dyn FnMut() -> Pin<Box<dyn Future<Output = Result<(Vec<RsaKey>, Option<Duration>), AppError>>>> + Send>`
pub type AsyncThreadSafeFnPtr = Box<dyn Fn() -> Pin<BoxedResultFuture> + Send>;
/// Just for the kick of it, here is the type with no type aliases:

/// The type representing a key provider that fetches keys from Google.
pub struct GoogleKeyProvider {
    /// The map of RSA keys.
    pub keys: HashMap<KeyId, RsaKey>,
    /// The instant when the keys expire.
    pub expires_at: Option<Instant>,
    /// The function pointer to fetch the keys.
    pub fetch: AsyncThreadSafeFnPtr,
}

/// The static HTTP client.
pub static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

impl GoogleKeyProvider {
    pub async fn new() -> Self {
        let mut manager = GoogleKeyProvider {
            keys: HashMap::new(),
            expires_at: None,
            fetch: Box::new(|| {
                Box::pin(async {
                    let resp = HTTP_CLIENT
                        .get_or_init(reqwest::Client::new)
                        .get(GOOGLE_CERT_URL)
                        .send()
                        .await
                        .map_err(AppError::from)?;
                    let max_age = get_max_age(&resp);
                    #[derive(Deserialize)]
                    struct Response {
                        keys: Vec<RsaKey>,
                    }
                    Ok((resp.json::<Response>().await?.keys, max_age))
                })
            }),
        };
        manager
            .refetch()
            .await
            .expect("Failed to fetch public keys from Google");
        manager
    }

    /// Refetches the keys from Google.
    async fn refetch(&mut self) -> Result<(), AppError> {
        let (keys, expires_at) = (self.fetch)().await?;
        self.expires_at = expires_at.map(|at| Instant::now() + at);
        self.keys = keys.into_iter().map(|key| (key.kid.clone(), key)).collect();
        Ok(())
    }

    /// Gets the RSA key with the specified key ID (kid).
    pub async fn get_key(&mut self, kid: impl AsRef<str>) -> Result<&RsaKey, AppError> {
        if self.keys.is_empty() || self.expires_at.is_some_and(|at| at < Instant::now()) {
            self.refetch().await?;
        }
        self.keys
            .get(kid.as_ref())
            .ok_or_else(|| AppError::InternalServer(format!("Unknown key id: {}", kid.as_ref())))
    }

    #[cfg(test)]
    pub fn mock<'a: 'static>(rsa_key: &'a RsaKey, expires_at: &'a Option<Duration>) -> Self {
        GoogleKeyProvider {
            keys: HashMap::new(),
            expires_at: None,
            fetch: Box::new(|| Box::pin(async { Ok((vec![rsa_key.clone()], *expires_at)) })),
        }
    }
}
