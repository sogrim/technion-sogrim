use crate::db::Resource;
use crate::impl_from_request;
use bson::{doc, Document};
use serde::{Deserialize, Serialize};

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Admin {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
}

impl Resource for Admin {
    fn collection_name() -> &'static str {
        "Admins"
    }
    fn key(&self) -> Document {
        doc! {"_id": self.sub.clone()}
    }
}

impl_from_request!(for Admin);
