use lazy_static::lazy_static;

lazy_static! {
    static ref IP: String = std::env::var("IP").expect("Environment Error");
    static ref PORT: String = std::env::var("PORT").expect("Environment Error");
    static ref URI: String = std::env::var("URI").expect("Environment Error");
    static ref CLIENT_ID: String = std::env::var("CLIENT_ID").expect("Environment Error");
    static ref PROFILE: String = std::env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
    pub static ref CONFIG: Config<'static> = Config::from_env();
}

#[derive(Debug, Clone)]
pub struct Config<'cfg> {
    pub ip: &'cfg str,
    pub port: u16,
    pub uri: &'cfg str,
    pub client_id: &'cfg str,
    pub profile: &'cfg str,
}

impl Config<'_> {
    pub fn from_env() -> Self {
        Config {
            ip: &IP,
            port: PORT.parse::<u16>().expect("Failed to parse port"),
            uri: &URI,
            client_id: &CLIENT_ID,
            profile: &PROFILE,
        }
    }
}
