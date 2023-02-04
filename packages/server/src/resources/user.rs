use super::catalog::DisplayCatalog;
use crate::{core::degree_status::DegreeStatus, db::CollectionName, impl_from_request};
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
}

impl CollectionName for User {
    fn collection_name() -> &'static str {
        "Users"
    }
}

impl_from_request!(for User);
