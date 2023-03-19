use super::catalog::DisplayCatalog;
use crate::{core::degree_status::DegreeStatus, db::Resource, impl_from_request};
use bson::{doc, DateTime, Document};
use serde::{Deserialize, Serialize};

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

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
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

impl_from_request!(for User);
