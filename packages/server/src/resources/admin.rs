use crate::db::CollectionName;
use crate::impl_from_request;
use bson::doc;
use serde::{Deserialize, Serialize};

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Admin {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
    pub institution: String,
    pub faculty: String,
}

impl CollectionName for Admin {
    fn collection_name() -> &'static str {
        "Admins"
    }
}

impl_from_request!(for Admin);
