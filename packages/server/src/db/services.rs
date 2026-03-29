use crate::error::AppError;
pub use bson::{doc, Bson};
use bson::{serialize_to_bson, serialize_to_document};
use futures_util::TryStreamExt;
use mongodb::options::ReturnDocument;
use serde::{de::DeserializeOwned, Serialize};

use super::{Db, FilterOption, InsertOption, Resource};

impl Db {
    pub async fn get<R>(&self, id: impl Serialize) -> Result<R, AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        let id = serialize_to_bson(&id)?;
        self.collection::<R>()
            .find_one(doc! {"_id": id.clone()})
            .await?
            .ok_or_else(|| AppError::NotFound(format!("{}: {}", R::collection_name(), id)))
    }

    pub async fn get_all<R>(&self) -> Result<Vec<R>, AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        Ok(self
            .collection::<R>()
            .find(doc! {})
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
            .collection::<R>()
            .find(doc! {field_to_filter.as_ref(): { filter_option.as_ref(): filter.into()}})
            .await?
            .try_collect::<Vec<R>>()
            .await?)
    }

    async fn _update<R>(&self, resource: R, insert_option: InsertOption) -> Result<R, AppError>
    where
        R: Resource + Send + Sync + Unpin,
    {
        self.collection::<R>()
            .find_one_and_update(
                resource.key(),
                doc! { insert_option.as_ref(): serialize_to_document(&resource)? },
            )
            .upsert(true)
            .return_document(ReturnDocument::After)
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
        let id = serialize_to_bson(&id)?;
        Ok(self
            .collection::<R>()
            .delete_one(doc! {"_id": id.clone()})
            .await
            .map(|_| ())?) // Discard the result of the delete operation
    }
}
