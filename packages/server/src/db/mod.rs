pub mod services;

#[cfg(test)]
pub mod tests;

#[macro_export]
macro_rules! init_mongodb_client {
    () => {{
        let client = Client::with_uri_str(CONFIG.uri)
            .await
            .expect("Failed to connect to MongoDB");

        log::info!("Connected to MongoDB");

        client
    }};
}
