pub use config::ConfigError;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct Config {
    pub ip: String,
    pub port: u16,
    pub uri: String,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let mut cfg = config::Config::new();
        cfg.merge(config::Environment::new())?;
        cfg.try_into()
    }
}
