use crate::config::CONFIG;
use crate::error::AppError;
pub use bson::{doc, Bson, Document};
use futures_util::TryStreamExt;
use mongodb::options::{FindOneAndUpdateOptions, ReturnDocument, UpdateModifications};
use serde::de::DeserializeOwned;
use serde::Serialize;

use super::{CollectionName, Db, FilterType};

impl Db {
    pub async fn get<T>(&self, id: impl Serialize) -> Result<T, AppError>
    where
        T: CollectionName + DeserializeOwned + Send + Sync + Unpin,
    {
        let id = bson::to_bson(&id)?;
        self.client()
            .database(CONFIG.profile)
            .collection::<T>(T::collection_name())
            .find_one(doc! {"_id": id.clone()}, None)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("{}: {}", T::collection_name(), id)))
    }

    pub async fn get_all<T>(&self) -> Result<Vec<T>, AppError>
    where
        T: CollectionName + DeserializeOwned + Send + Sync + Unpin,
    {
        Ok(self
            .client()
            .database(CONFIG.profile)
            .collection::<T>(T::collection_name())
            .find(None, None)
            .await?
            .try_collect::<Vec<T>>()
            .await?)
    }

    pub async fn get_filtered<T>(
        &self,
        filter_type: FilterType,
        field_to_filter: impl AsRef<str>,
        filter: impl Into<Bson>,
    ) -> Result<Vec<T>, AppError>
    where
        T: CollectionName + DeserializeOwned + Send + Sync + Unpin,
    {
        Ok(self
            .client()
            .database(CONFIG.profile)
            .collection::<T>(T::collection_name())
            .find(
                doc! {field_to_filter.as_ref(): { filter_type.as_ref(): filter.into()}},
                None,
            )
            .await?
            .try_collect::<Vec<T>>()
            .await?)
    }

    pub async fn update<T>(&self, id: impl Serialize, document: Document) -> Result<T, AppError>
    where
        T: CollectionName + DeserializeOwned + Send + Sync + Unpin,
    {
        let id = bson::to_bson(&id)?;
        self.client()
            .database(CONFIG.profile)
            .collection::<T>(T::collection_name())
            .find_one_and_update(
                doc! {"_id": id.clone()},
                UpdateModifications::Document(document),
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
                AppError::NotFound(format!("{}: {}", T::collection_name(), id))
            })
    }

    pub async fn delete<T>(&self, id: impl Serialize) -> Result<(), AppError>
    where
        T: CollectionName + DeserializeOwned + Send + Sync + Unpin,
    {
        let id = bson::to_bson(&id)?;
        Ok(self
            .client()
            .database(CONFIG.profile)
            .collection::<T>(T::collection_name())
            .delete_one(doc! {"_id": id.clone()}, None)
            .await
            .map(|_| ())?) // Discard the result of the delete operation
    }
}
