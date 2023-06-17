const IP: &str = env!("IP");
const PORT: &str = env!("PORT");
const URI: &str = env!("URI");
const CLIENT_ID: &str = env!("CLIENT_ID");
const PROFILE: Option<&str> = option_env!("PROFILE");

#[derive(Debug, Clone)]
pub struct Config {
    pub ip: &'static str,
    pub port: &'static str,
    pub uri: &'static str,
    pub client_id: &'static str,
    pub profile: &'static str,
}

pub const CONFIG: Config = Config {
    ip: IP,
    port: PORT,
    uri: URI,
    client_id: CLIENT_ID,
    // TODO: use unwrap_or once it's stable in const fn
    profile: if let Some(profile) = PROFILE {
        profile
    } else {
        "debug"
    },
};
