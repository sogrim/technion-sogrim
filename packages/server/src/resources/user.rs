use super::catalog::DisplayCatalog;
use crate::core::degree_status::DegreeStatus;
use crate::db;
use crate::impl_from_request;
use crate::middleware::auth::Sub;
use actix_web::dev::Payload;
use actix_web::error::ErrorInternalServerError;
use actix_web::{web::Data, Error, FromRequest, HttpMessage, HttpRequest};
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
pub struct Settings {
    pub modified: bool,
    pub compute_in_progress: bool,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
    pub details: Option<UserDetails>,
    pub settings: Settings,
}

impl User {
    pub fn new_document(sub: &str) -> bson::Document {
        let user = User {
            sub: sub.into(),
            details: Some(UserDetails::default()),
            ..Default::default()
        };
        // Should always unwrap successfully here..
        bson::to_document(&user).unwrap_or(doc! {"sub" : sub, "details": null})
    }
    pub fn into_document(self) -> bson::Document {
        // Should always unwrap successfully here..
        bson::to_document(&self).unwrap_or(doc! {"sub" : self.sub, "details": null})
    }
}

impl_from_request!(resource = User, getter = get_user_by_id);
