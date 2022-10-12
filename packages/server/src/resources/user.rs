use super::catalog::DisplayCatalog;
use crate::core::degree_status::DegreeStatus;
use crate::db::CollectionName;
use crate::error::AppError;
use crate::impl_from_request;
use crate::middleware::auth::Sub;
use crate::Db;
use actix_web::dev::Payload;
use actix_web::{web::Data, FromRequest, HttpMessage, HttpRequest};
use bson::doc;
use futures_util::Future;
use serde::{Deserialize, Serialize};
use std::pin::Pin;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    pub catalog: Option<DisplayCatalog>,
    pub degree_status: DegreeStatus,
    pub modified: bool,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserSettings {
    pub compute_in_progress: bool,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
    pub details: UserDetails,
    pub settings: UserSettings,
}

impl CollectionName for User {
    fn collection_name() -> &'static str {
        "Users"
    }
}

impl_from_request!(for User);
