use crate::config::CONFIG;
use crate::error::AppError;
use crate::resources::admin::Admin;
use crate::resources::catalog::{Catalog, DisplayCatalog};
use crate::resources::course::{Course, Malags};
use crate::resources::user::User;
use bson::oid::ObjectId;
pub use bson::{doc, Bson, Document};
use futures_util::TryStreamExt;
use mongodb::options::{FindOneAndUpdateOptions, ReturnDocument, UpdateModifications};

use super::Db;

macro_rules! impl_get {
    (
        fn_name=$fn_name:ident,
        db_item=$db_item:ty,
        db_key_type=$db_key_type:ty
    ) => {
        pub async fn $fn_name(&self, id: $db_key_type) -> Result<$db_item, AppError> {
            match self
                .client()
                .database(CONFIG.profile)
                .collection::<$db_item>(format!("{}s", stringify!($db_item)).as_str())
                .find_one(doc! {"_id": id}, None)
                .await
            {
                Ok(Some(id)) => Ok(id),
                Ok(None) => Err(AppError::NotFound(format!(
                    "{}: {} ",
                    stringify!($db_item),
                    id.to_string()
                ))),
                Err(err) => Err(AppError::MongoDriver(err.to_string())),
            }
        }
    };
}

macro_rules! impl_get_all {
    (
        fn_name=$fn_name:ident,
        db_item=$db_item:ty,
        db_coll_name=$db_coll_name:literal
    ) => {
        pub async fn $fn_name(&self) -> Result<Vec<$db_item>, AppError> {
            match self
                .client()
                .database(CONFIG.profile)
                .collection::<$db_item>($db_coll_name)
                .find(None, None)
                .await
            {
                Ok(docs) => Ok(docs
                    .try_collect::<Vec<$db_item>>()
                    .await
                    .map_err(|e| AppError::MongoDriver(e.to_string()))?),
                Err(err) => Err(AppError::MongoDriver(err.to_string())),
            }
        }
    };
}

macro_rules! impl_get_filtered {
    (
        fn_name=$fn_name:ident,
        db_item=$db_item:ty,
        db_coll_name=$db_coll_name:literal,
        filter_by=$filter_by:literal,
        filter_type=$filter_type:literal
    ) => {
        pub async fn $fn_name(&self, filter: impl Into<Bson>) -> Result<Vec<$db_item>, AppError> {
            match self
                .client()
                .database(CONFIG.profile)
                .collection::<$db_item>($db_coll_name)
                .find(doc! {$filter_by: { $filter_type: filter.into()}}, None)
                .await
            {
                Ok(docs) => Ok(docs
                    .try_collect::<Vec<$db_item>>()
                    .await
                    .map_err(|e| AppError::MongoDriver(e.to_string()))?),
                Err(err) => Err(AppError::MongoDriver(err.to_string())),
            }
        }
    };
}

macro_rules! impl_update {
    (
        fn_name=$fn_name:ident,
        db_item=$db_item:ty,
        db_key_type=$db_key_type:ty,
        db_coll_name=$db_coll_name:literal
    ) => {
        pub async fn $fn_name(
            &self,
            id: $db_key_type,
            document: Document,
        ) -> Result<$db_item, AppError> {
            match self
                .client()
                .database(CONFIG.profile)
                .collection::<$db_item>($db_coll_name)
                .find_one_and_update(
                    doc! {"_id": id},
                    UpdateModifications::Document(document),
                    Some(
                        FindOneAndUpdateOptions::builder()
                            .upsert(true)
                            .return_document(ReturnDocument::After)
                            .build(),
                    ),
                )
                .await
            {
                Ok(item) => item.ok_or_else(|| {
                    // This should never happen, but to avoid unwrapping we return an explicit error
                    AppError::NotFound(format!("{}: {}", stringify!($db_item), id.to_string()))
                }),
                Err(err) => Err(AppError::MongoDriver(err.to_string())),
            }
        }
    };
}

macro_rules! impl_delete {
    (
        fn_name=$fn_name:ident,
        db_item=$db_item:ty,
        db_key_type=$db_key_type:ty,
        db_coll_name=$db_coll_name:literal
    ) => {
        pub async fn $fn_name(&self, id: $db_key_type) -> Result<(), AppError> {
            match self
                .client()
                .database(CONFIG.profile)
                .collection::<$db_item>($db_coll_name)
                .delete_one(doc! {"_id": id}, None)
                .await
            {
                Ok(_) => Ok(()),
                Err(err) => Err(AppError::MongoDriver(err.to_string())),
            }
        }
    };
}

impl Db {
    // =============== CATALOG CRUD ===============

    impl_get!(
        fn_name = get_catalog_by_id,
        db_item = Catalog,
        db_key_type = &ObjectId
    );

    impl_get_all!(
        fn_name = get_all_catalogs,
        db_item = DisplayCatalog,
        db_coll_name = "Catalogs"
    );

    impl_update!(
        fn_name = find_and_update_catalog,
        db_item = Catalog,
        db_key_type = &ObjectId,
        db_coll_name = "Catalogs"
    );

    // =============== COURSE CRUD ===============

    impl_get!(
        fn_name = get_course_by_id,
        db_item = Course,
        db_key_type = &str
    );

    impl_get_all!(
        fn_name = get_all_courses,
        db_item = Course,
        db_coll_name = "Courses"
    );

    impl_get_filtered!(
        fn_name = get_courses_by_ids,
        db_item = Course,
        db_coll_name = "Courses",
        filter_by = "_id",
        filter_type = "$in"
    );

    impl_get_filtered!(
        fn_name = get_courses_filtered_by_name,
        db_item = Course,
        db_coll_name = "Courses",
        filter_by = "name",
        filter_type = "$regex"
    );

    impl_get_filtered!(
        fn_name = get_courses_filtered_by_number,
        db_item = Course,
        db_coll_name = "Courses",
        filter_by = "_id",
        filter_type = "$regex"
    );

    impl_update!(
        fn_name = find_and_update_course,
        db_item = Course,
        db_key_type = &str,
        db_coll_name = "Courses"
    );

    impl_delete!(
        fn_name = delete_course,
        db_item = Course,
        db_key_type = &str,
        db_coll_name = "Courses"
    );

    impl_get_all!(
        fn_name = get_all_malags,
        db_item = Malags,
        db_coll_name = "Malags"
    );

    // =============== USER CRUD ===============

    impl_get!(fn_name = get_user_by_id, db_item = User, db_key_type = &str);

    impl_update!(
        fn_name = find_and_update_user,
        db_item = User,
        db_key_type = &str,
        db_coll_name = "Users"
    );

    // =============== ADMIN CRUD ===============

    impl_get!(
        fn_name = get_admin_by_id,
        db_item = Admin,
        db_key_type = &str
    );
}
