use crate::config::CONFIG;
use crate::error::AppError;
use bson::to_bson;
pub use bson::{doc, Bson};
use futures_util::TryStreamExt;
use mongodb::options::{FindOneAndUpdateOptions, ReturnDocument, UpdateModifications};
use serde::{de::DeserializeOwned, Serialize};

use super::{Db, FilterOption, InsertOption, Resource};

impl Db {
    pub async fn get<R>(&self, id: impl Serialize) -> Result<R, AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        let id = bson::to_bson(&id)?;
        self.client()
            .database(CONFIG.profile)
            .collection::<R>(R::collection_name())
            .find_one(doc! {"_id": id.clone()}, None)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("{}: {}", R::collection_name(), id)))
    }

    pub async fn get_all<R>(&self) -> Result<Vec<R>, AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        Ok(self
            .client()
            .database(CONFIG.profile)
            .collection::<R>(R::collection_name())
            .find(None, None)
            .await?
            .try_collect::<Vec<R>>()
            .await?)
    }

    pub async fn get_filtered<R>(
        &self,
        filter_option: FilterOption,
        field_to_filter: impl AsRef<str>,
        filter: impl Into<Bson>,
    ) -> Result<Vec<R>, AppError>
    where
        R: Resource + DeserializeOwned + Send + Sync + Unpin,
    {
        Ok(self
            .client()
            .database(CONFIG.profile)
            .collection::<R>(R::collection_name())
            .find(
                doc! {field_to_filter.as_ref(): { filter_option.as_ref(): filter.into()}},
                None,
            )
            .await?
            .try_collect::<Vec<R>>()
            .await?)
    }

    async fn _update<R>(&self, resource: R, insert_option: InsertOption) -> Result<R, AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        self.client()
            .database(CONFIG.profile)
            .collection::<R>(R::collection_name())
            .find_one_and_update(
                resource.key(),
                UpdateModifications::Document(doc! { insert_option.as_ref(): to_bson(&resource)? }),
                Some(
                    FindOneAndUpdateOptions::builder()
                        .upsert(true)
                        .return_document(ReturnDocument::After)
                        .build(),
                ),
            )
            .await?
            .ok_or_else(|| {
                // This should never happen, but to avoid unwrapping we return an explicit error
                AppError::NotFound(R::collection_name().to_string())
            })
    }

    pub async fn update<R>(&self, resource: R) -> Result<R, AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        self._update::<R>(resource, InsertOption::Set).await
    }

    pub async fn create_or_update<R>(&self, resource: R) -> Result<R, AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        self._update::<R>(resource, InsertOption::SetOnInsert).await
    }

    pub async fn delete<R>(&self, id: impl Serialize) -> Result<(), AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        let id = bson::to_bson(&id)?;
        Ok(self
            .client()
            .database(CONFIG.profile)
            .collection::<R>(R::collection_name())
            .delete_one(doc! {"_id": id.clone()}, None)
            .await
            .map(|_| ())?) // Discard the result of the delete operation
    }
}
