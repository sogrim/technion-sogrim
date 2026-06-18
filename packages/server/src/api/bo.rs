//! Read-only endpoints powering the back-office app (`packages/sogrim-bo-app`).
//!
//! Every handler takes `_admin: User`, which runs the permission-checking
//! extractor; mounted under the `Permissions::Admin` tier in `main.rs`, these
//! are therefore gated to admins (and owners) server-side. They are strictly
//! read-only — viewing catalogs, courses and users.

use std::str::FromStr;

use crate::db::{Db, Resource};
use crate::error::AppError;
use crate::resources::catalog::Catalog;
use crate::resources::course::Course;
use crate::resources::user::{User, UserSummary};
use axum::{extract::Path, response::IntoResponse, Extension, Json};
use bson::{doc, Document};
use futures_util::TryStreamExt;
use mongodb::Collection;

/////////////////////////////////////////////////////////////////////////////
// Catalogs
/////////////////////////////////////////////////////////////////////////////

pub async fn get_catalogs(
    _admin: User,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    db.get_all::<Catalog>().await.map(Json)
}

pub async fn get_catalog(
    _admin: User,
    Path(id): Path<String>,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    let obj_id = bson::oid::ObjectId::from_str(&id).map_err(|e| AppError::Bson(e.to_string()))?;
    db.get::<Catalog>(&obj_id).await.map(Json)
}

/////////////////////////////////////////////////////////////////////////////
// Courses
/////////////////////////////////////////////////////////////////////////////

pub async fn get_courses(
    _admin: User,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    db.get_all::<Course>().await.map(Json)
}

pub async fn get_course(
    _admin: User,
    Path(id): Path<String>,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    db.get::<Course>(id.as_str()).await.map(Json)
}

/////////////////////////////////////////////////////////////////////////////
// Users
/////////////////////////////////////////////////////////////////////////////

/// Project user documents to summaries, skipping any that don't match the
/// current `User` schema (e.g. legacy/partial documents written by other
/// branches). One bad document must not 500 the whole list.
pub fn summarize_users(docs: impl IntoIterator<Item = Document>) -> Vec<UserSummary> {
    docs.into_iter()
        .filter_map(|doc| match bson::deserialize_from_document::<User>(doc) {
            Ok(user) => Some(UserSummary::from(&user)),
            Err(err) => {
                log::warn!(
                    target: "bo",
                    "skipping user document that failed to deserialize: {err}"
                );
                None
            }
        })
        .collect()
}

pub async fn get_users(
    _admin: User,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    // Read raw documents and project leniently, so a single legacy/partial
    // document that no longer matches the `User` schema is skipped rather than
    // failing the entire list.
    let collection: Collection<Document> = db
        .client()
        .database(db.profile())
        .collection(User::collection_name());
    let docs: Vec<Document> = collection.find(doc! {}).await?.try_collect().await?;
    Ok(Json(summarize_users(docs)))
}

pub async fn get_user(
    _admin: User,
    Path(id): Path<String>,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    db.get::<User>(id.as_str()).await.map(Json)
}

#[cfg(test)]
mod tests {
    use super::summarize_users;
    use bson::doc;

    #[test]
    fn summarizes_valid_user_documents() {
        let summaries = summarize_users(vec![doc! { "_id": "good-user" }]);
        assert_eq!(summaries.len(), 1);
        assert_eq!(summaries[0].sub, "good-user");
    }

    #[test]
    fn skips_documents_that_dont_match_the_user_schema() {
        // The second doc has an invalid `permissions` variant; it must be skipped,
        // not 500 the whole list (the shared dev DB has such legacy documents).
        let summaries = summarize_users(vec![
            doc! { "_id": "good-user" },
            doc! { "_id": "legacy", "permissions": "NotARealPermission" },
        ]);
        assert_eq!(summaries.len(), 1);
        assert_eq!(summaries[0].sub, "good-user");
    }

    #[test]
    fn returns_empty_without_panicking_when_all_docs_are_bad() {
        let summaries = summarize_users(vec![doc! { "_id": "x", "permissions": 999 }]);
        assert!(summaries.is_empty());
    }
}
