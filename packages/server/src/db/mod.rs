use bson::Document;
use mongodb::Client;
use serde::{de::DeserializeOwned, Serialize};

use crate::config::CONFIG;

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
    pub fn client(&self) -> &Client {
        &self.client
    }
}

impl From<Client> for Db {
    fn from(client: Client) -> Self {
        Self { client }
    }
}

pub enum FilterType {
    Regex,
    In,
}

pub enum InsertType {
    Set,
    SetOnInsert,
}

impl AsRef<str> for FilterType {
    fn as_ref(&self) -> &str {
        match self {
            FilterType::Regex => "$regex",
            FilterType::In => "$in",
        }
    }
}

impl AsRef<str> for InsertType {
    fn as_ref(&self) -> &str {
        match self {
            InsertType::Set => "$set",
            InsertType::SetOnInsert => "$setOnInsert",
        }
    }
}

pub trait Resource: Serialize + DeserializeOwned {
    fn collection_name() -> &'static str;
    fn key(&self) -> Document;
}
