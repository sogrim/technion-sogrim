use dotenvy::{dotenv, dotenv_iter};

fn main() {
    let Ok(dotenv_path) = dotenv() else {
        // This is not an error, it just means we are in a production environment.
        return;
    };
    println!("cargo:rerun-if-changed={}", dotenv_path.display());
    let mut env_var_iter = dotenv_iter().expect("failed to read .env file");
    while let Some(Ok((key, value))) = env_var_iter.next() {
        println!("cargo:rustc-env={}={}", key, value);
    }
}
