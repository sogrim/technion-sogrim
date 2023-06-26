use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use actix_web::http::header;
use reqwest::Response;
use serde::Deserialize;

use crate::error::AppError;

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
#[derive(Debug, Deserialize)]
pub struct RsaKey {
    kid: KeyId,
    n: RsaModulus,
    e: RsaExponent,
}
impl RsaKey {
    pub fn components(&self) -> (&RsaModulus, &RsaExponent) {
        (&self.n, &self.e)
    }
}
#[derive(Debug)]
pub struct GoogleKeyProvider {
    client: reqwest::Client,
    keys: HashMap<KeyId, RsaKey>,
    expires_at: Option<Instant>,
}

impl GoogleKeyProvider {
    const GOOGLE_CERT_URL: &'static str = "https://www.googleapis.com/oauth2/v3/certs";
    pub async fn new() -> Self {
        let mut provider = GoogleKeyProvider {
            client: reqwest::Client::default(),
            keys: HashMap::new(),
            expires_at: None,
        };
        provider
            .refetch()
            .await
            .expect("Failed to fetch public keys from Google");
        provider
    }

    async fn refetch(&mut self) -> Result<(), AppError> {
        let res = self.client.get(Self::GOOGLE_CERT_URL).send().await?;
        self.expires_at = get_max_age(&res).map(|max_age| Instant::now() + max_age);
        #[derive(Deserialize)]
        struct RsaKeys {
            keys: Vec<RsaKey>,
        }
        let keys_json: RsaKeys = res.json().await?;
        self.keys = keys_json
            .keys
            .into_iter()
            .map(|key| (key.kid.clone(), key))
            .collect();
        Ok(())
    }

    pub async fn get_key(&mut self, kid: impl AsRef<str>) -> Result<&RsaKey, AppError> {
        if self.keys.is_empty() || self.expires_at.is_some_and(|at| at < Instant::now()) {
            self.refetch().await?;
        }
        self.keys
            .get(kid.as_ref())
            .ok_or_else(|| AppError::InternalServer(format!("Unknown key id: {}", kid.as_ref())))
    }
}
