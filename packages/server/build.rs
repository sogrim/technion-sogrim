use dotenvy::{dotenv, dotenv_iter};

fn main() {
    let (Ok(dotenv_path), Ok(mut dotenv_iter)) = (dotenv(), dotenv_iter()) else {
        // In this case, we don't have a .env file and we should assume that the environment variables are already set
        // NOTE: This is NOT an error, it just means we are in a production or CI environment
        return;
    };

    // rerun-if-changed is used to tell cargo to re-run this build script if the .env file changes
    println!("cargo:rerun-if-changed={}", dotenv_path.display());

    // Set the environment variables
    while let Some(Ok((key, value))) = dotenv_iter.next() {
        println!("cargo:rustc-env={}={}", key, value);
    }
}
