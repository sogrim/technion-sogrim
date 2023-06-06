use bson::{doc, Document};
use mongodb::Client;
use serde::{de::DeserializeOwned, Serialize};

use crate::{config::CONFIG, error::AppError};

pub mod services;

#[cfg(test)]
pub mod tests;

#[derive(Debug, Clone)]
pub struct Db {
    client: Client,
}

impl Db {
    pub async fn new() -> Self {
        let client = Client::with_uri_str(&CONFIG.uri)
            .await
            .expect("Failed to connect to MongoDB");
        Self { client }
    }
    pub async fn ping(&self) -> Result<(), AppError> {
        self.client()
            .database("admin")
            .run_command(doc! {"ping": 1}, None)
            .await
            .map_err(|e| AppError::InternalServer(e.to_string()))
            .map(|_| ())
    }
    pub fn client(&self) -> &Client {
        &self.client
    }
}

impl From<Client> for Db {
    fn from(client: Client) -> Self {
        Self { client }
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
