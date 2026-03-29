use std::env;
use std::fmt;

/// Server configuration loaded from `SOGRIM_*` environment variables at runtime.
#[derive(Debug, Clone)]
pub struct Config {
    pub uri: String,
    pub port: u16,
    pub client_id: String,
    pub profile: String,
}

#[derive(Debug)]
pub enum ConfigError {
    Missing(&'static str),
    Invalid(&'static str, String),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing(name) => write!(f, "required environment variable {name} is not set"),
            Self::Invalid(name, value) => {
                write!(f, "invalid value for {name}: {value:?}")
            }
        }
    }
}

impl std::error::Error for ConfigError {}

impl Config {
    /// Load full server config from `SOGRIM_*` environment variables.
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Self {
            uri: required("SOGRIM_URI")?,
            port: optional("SOGRIM_PORT")?
                .map(|s| {
                    s.parse::<u16>()
                        .map_err(|_| ConfigError::Invalid("SOGRIM_PORT", s))
                })
                .transpose()?
                .unwrap_or(5545),
            client_id: required("SOGRIM_CLIENT_ID")?,
            profile: optional("SOGRIM_PROFILE")?.unwrap_or_else(|| "debug".into()),
        })
    }
}

fn required(name: &'static str) -> Result<String, ConfigError> {
    env::var(name).map_err(|_| ConfigError::Missing(name))
}

fn optional(name: &'static str) -> Result<Option<String>, ConfigError> {
    match env::var(name) {
        Ok(v) if !v.is_empty() => Ok(Some(v)),
        _ => Ok(None),
    }
}
