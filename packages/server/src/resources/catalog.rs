use crate::{
    core::{
        credit_transfer_graph::find_traversal_order,
        types::{CreditOverflow, Rule},
    },
    resources::course::CourseBank,
};
use serde::{self, Deserialize, Serialize};
use std::collections::HashMap;

use super::course::CourseId;

pub(crate) type OptionalReplacements = Vec<CourseId>;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Catalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: bson::oid::ObjectId,
    pub name: String,
    pub total_credit: f64,
    pub description: String,
    pub course_banks: Vec<CourseBank>,
    pub credit_overflows: Vec<CreditOverflow>,
    pub course_to_bank: HashMap<CourseId, String>,
    pub catalog_replacements: HashMap<CourseId, OptionalReplacements>, // All replacements which are mentioned in the catalog
    pub common_replacements: HashMap<CourseId, OptionalReplacements>, // Common replacement which usually approved by the coordinators
}

impl Catalog {
    pub fn get_course_list(&self, name: &str) -> Vec<CourseId> {
        let mut course_list_for_bank = Vec::new();
        for (course_id, bank_name) in &self.course_to_bank {
            if *bank_name == name {
                course_list_for_bank.push(course_id.to_string());
            }
        }
        course_list_for_bank
    }

    pub fn get_course_bank_by_name(&self, name: &str) -> Option<&CourseBank> {
        self.course_banks.iter().find(|bank| bank.name == name)
    }

    pub fn get_bank_traversal_order(&self) -> Vec<CourseBank> {
        find_traversal_order(&self)
    }

    pub fn get_all_course_ids(&self) -> Vec<CourseId> {
        self.course_to_bank.clone().into_keys().collect()
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DisplayCatalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: bson::oid::ObjectId,
    pub name: String,
    pub total_credit: f64,
    pub description: String,
}

impl From<Catalog> for DisplayCatalog {
    fn from(catalog: Catalog) -> Self {
        DisplayCatalog {
            id: catalog.id,
            name: catalog.name,
            total_credit: catalog.total_credit,
            description: catalog.description,
        }
    }
}
