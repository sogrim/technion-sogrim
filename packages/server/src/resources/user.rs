use super::catalog::DisplayCatalog;
use super::course::CourseStatus;
use crate::core::degree_status::DegreeStatus;
use crate::db;
use crate::impl_from_request;
use crate::middleware::auth::Sub;
use actix_web::dev::Payload;
use actix_web::error::{ErrorInternalServerError, ErrorUnauthorized};
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

impl_from_request!(resource = User, getter = get_user_by_id);
