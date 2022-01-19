use crate::core::degree_status::DegreeStatus;
use crate::db;
use crate::middleware::auth::Sub;
use actix_web::dev::Payload;
use actix_web::error::{ErrorInternalServerError, ErrorUnauthorized};
use actix_web::{web, Error, FromRequest, HttpMessage, HttpRequest};
use bson::doc;
use futures_util::Future;
use mongodb::Client;
use serde::{Deserialize, Serialize};
use std::pin::Pin;

use super::catalog::DisplayCatalog;
use super::course::CourseStatus;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    pub catalog: Option<DisplayCatalog>,
    pub degree_status: DegreeStatus,
    pub modified: bool,
}

impl UserDetails {
    pub fn get_course_status(&self, id: &str) -> Option<&CourseStatus> {
        // returns the first course_status with the given id
        for course_status in self.degree_status.course_statuses.iter() {
            if course_status.course.id == id {
                return Some(course_status);
            }
        }
        None
    }

    pub fn get_mut_course_status(&mut self, id: &str) -> Option<&mut CourseStatus> {
        // returns the first course_status with the given id
        for course_status in &mut self.degree_status.course_statuses.iter_mut() {
            if course_status.course.id == id {
                return Some(course_status);
            }
        }
        None
    }
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
    pub details: Option<UserDetails>,
}

impl User {
    pub fn new_document(sub: &str) -> bson::Document {
        let user = User {
            sub: sub.into(),
            details: Some(UserDetails::default()),
        };
        // Should always unwrap successfully here..
        bson::to_document(&user).unwrap_or(doc! {"sub" : sub, "details": null})
    }
    pub fn into_document(self) -> bson::Document {
        // Should always unwrap successfully here..
        bson::to_document(&self).unwrap_or(doc! {"sub" : self.sub, "details": null})
    }
}

impl FromRequest for User {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let req = req.clone();
        Box::pin(async move {
            let client = match req.app_data::<web::Data<Client>>() {
                Some(client) => client,
                None => return Err(ErrorInternalServerError("Db client was not initialized!")),
            };
            match req.extensions().get::<Sub>() {
                Some(user_id) => db::services::get_user_by_id(user_id, client)
                    .await
                    .map_err(ErrorInternalServerError),
                None => Err(ErrorUnauthorized(
                    "Authorization process did not complete successfully!",
                )),
            }
        })
    }

    fn extract(req: &HttpRequest) -> Self::Future {
        Self::from_request(req, &mut Payload::None)
    }
}