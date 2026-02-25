use dotenvy::{dotenv, dotenv_iter};
use std::collections::HashSet;

const REQUIRED_ENV_VARS: [&str; 4] = ["IP", "PORT", "URI", "CLIENT_ID"];

fn main() {
    let mut loaded_from_dotenv = HashSet::new();

    if let (Ok(dotenv_path), Ok(mut dotenv_iter)) = (dotenv(), dotenv_iter()) {
        // rerun-if-changed is used to tell cargo to re-run this build script if the .env file changes
        println!("cargo:rerun-if-changed={}", dotenv_path.display());

        while let Some(Ok((key, value))) = dotenv_iter.next() {
            loaded_from_dotenv.insert(key.clone());
            println!("cargo:rustc-env={}={}", key, value);
        }
    }

    let missing: Vec<&str> = REQUIRED_ENV_VARS
        .iter()
        .copied()
        .filter(|key| std::env::var_os(key).is_none() && !loaded_from_dotenv.contains(*key))
        .collect();

    if !missing.is_empty() {
        panic!(
            "Missing required environment variables for compile-time config: {}. Set them in your shell/CI or add them to packages/server/.env",
            missing.join(", ")
        );
    };
}
