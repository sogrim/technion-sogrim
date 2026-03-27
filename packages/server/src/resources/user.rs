use super::catalog::DisplayCatalog;
use crate::{
    core::degree_status::DegreeStatus,
    db::{Db, Resource},
    error::AppError,
    middleware::auth::Sub,
};
use actix_web::{dev::Payload, web::Data, FromRequest, HttpMessage, HttpRequest};
use bson::{doc, DateTime, Document};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    pub catalog: Option<DisplayCatalog>,
    pub degree_status: DegreeStatus,
    pub compute_in_progress: bool,
    pub modified: bool,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserSettings {
    pub dark_mode: bool,
}

#[derive(Default, Clone, Copy, Debug, Deserialize, Serialize, PartialEq, PartialOrd)]
pub enum Permissions {
    #[default]
    Student = 0,
    Admin = 1,
    Owner = 2,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
    pub permissions: Permissions,
    pub details: UserDetails,
    pub settings: UserSettings,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_seen: Option<DateTime>,
}

impl Resource for User {
    fn collection_name() -> &'static str {
        "Users"
    }
    fn key(&self) -> Document {
        doc! {"_id": self.sub.clone()}
    }
}

impl FromRequest for User {
    type Error = AppError;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;
    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let req = req.clone();
        Box::pin(async move {
            let Some(db) = req.app_data::<Data<Db>>() else {
                return Err(AppError::InternalServer(
                    "Mongodb client not found in application data".into(),
                ));
            };
            let Some(permissions) = req.app_data::<Data<Permissions>>().cloned() else {
                return Err(AppError::InternalServer(
                    "Permissions not found in application data".into(),
                ));
            };
            let Some(id) = req.extensions().get::<Sub>().cloned() else {
                return Err(AppError::Middleware(
                    "Sub not found in request extensions".into(),
                ));
            };
            let user = db.get::<User>(id).await?;
            if user.permissions < **permissions {
                return Err(AppError::Unauthorized(
                    "User not authorized to access this resource".into(),
                ));
            }
            Ok(user)
        })
    }
    fn extract(req: &HttpRequest) -> Self::Future {
        Self::from_request(req, &mut Payload::None)
    }
}
