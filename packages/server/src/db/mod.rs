use bson::{doc, Document};
use mongodb::{Client, Collection};
use serde::{de::DeserializeOwned, Serialize};

use crate::error::AppError;

pub mod services;

#[cfg(test)]
pub mod tests;

#[derive(Debug, Clone)]
pub struct Db {
    client: Client,
    profile: String,
}

impl Db {
    pub async fn connect(uri: &str, profile: &str) -> Result<Self, AppError> {
        let client = Client::with_uri_str(uri)
            .await
            .map_err(|e| AppError::InternalServer(format!("MongoDB connection failed: {e}")))?;
        Ok(Self {
            client,
            profile: profile.to_owned(),
        })
    }

    pub fn collection<R: Resource + Send + Sync>(&self) -> Collection<R> {
        self.client
            .database(&self.profile)
            .collection(R::collection_name())
    }

    pub fn with_client(client: Client, profile: &str) -> Self {
        Self {
            client,
            profile: profile.to_owned(),
        }
    }

    pub async fn ping(&self) -> Result<(), AppError> {
        self.client()
            .database("admin")
            .run_command(doc! {"ping": 1})
            .await
            .map_err(|e| AppError::InternalServer(e.to_string()))
            .map(|_| ())
    }

    pub fn client(&self) -> &Client {
        &self.client
    }

    pub fn profile(&self) -> &str {
        &self.profile
    }

    /// Gracefully drain the connection pool. Call before the tokio runtime exits.
    pub async fn shutdown(self) {
        self.client.shutdown().await;
    }

    /// Convenience constructor for tests: reads SOGRIM_URI and SOGRIM_PROFILE from env.
    pub async fn from_test_env() -> Self {
        let _ = dotenvy::dotenv();
        let uri = std::env::var("SOGRIM_URI").expect("SOGRIM_URI must be set for tests");
        let profile = std::env::var("SOGRIM_PROFILE").unwrap_or_else(|_| "debug".into());
        Self::connect(&uri, &profile)
            .await
            .expect("Failed to connect to MongoDB for tests")
    }
}

pub enum FilterOption {
    Regex,
    In,
}

pub enum InsertOption {
    Set,
    SetOnInsert,
}

impl AsRef<str> for FilterOption {
    fn as_ref(&self) -> &str {
        match self {
            FilterOption::Regex => "$regex",
            FilterOption::In => "$in",
        }
    }
}

impl AsRef<str> for InsertOption {
    fn as_ref(&self) -> &str {
        match self {
            InsertOption::Set => "$set",
            InsertOption::SetOnInsert => "$setOnInsert",
        }
    }
}

pub trait Resource: Serialize + DeserializeOwned {
    fn collection_name() -> &'static str;
    fn key(&self) -> Document;
}
