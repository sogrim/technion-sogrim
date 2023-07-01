use crate::{
    core::{credit_transfer_graph::find_traversal_order, types::CreditOverflow},
    db::Resource,
    resources::course::CourseBank,
};
use bson::{doc, Document};
use regex::Regex;
use serde::{self, Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

use super::course::CourseId;

pub type OptionalReplacements = Vec<CourseId>;
pub type Replacements = HashMap<CourseId, OptionalReplacements>;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub enum Faculty {
    #[default]
    Unknown,
    ComputerScience,
    DataAndDecisionScience,
    Medicine,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Catalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: bson::oid::ObjectId,
    pub name: String,
    pub faculty: Faculty,
    pub total_credit: f64,
    pub description: String,
    pub course_banks: Vec<CourseBank>,
    pub credit_overflows: Vec<CreditOverflow>,
    pub catalog_replacements: Replacements, // All replacements which are mentioned in the catalog
    pub common_replacements: Replacements, // Common replacement which usually approved by the coordinators
}

impl Catalog {
    pub fn year(&self) -> usize {
        let default_year = 2018;
        Regex::new(r"(?P<year>\d{4})")
            .unwrap()
            .captures(&self.name)
            .map(|cap| cap["year"].parse::<usize>().unwrap_or(default_year))
            .unwrap_or(default_year)
    }

    pub fn get_course_bank_by_name(&self, name: &str) -> Option<&CourseBank> {
        self.course_banks.iter().find(|bank| bank.name == name)
    }

    pub fn get_bank_traversal_order(&self) -> Vec<CourseBank> {
        find_traversal_order(self)
    }

    pub fn get_all_course_ids(&self) -> HashSet<CourseId> {
        self.course_banks
            .iter()
            .fold(vec![], |mut acc, bank| {
                acc.extend(bank.courses());
                acc
            })
            .into_iter()
            .collect::<HashSet<_>>()
    }

    pub fn get_all_starts_with_predicates(&self) -> Vec<String> {
        self.course_banks.iter().fold(vec![], |mut acc, bank| {
            acc.extend(
                bank.predicates()
                    .into_iter()
                    .filter_map(|pred| pred.starts_with_or_none()),
            );
            acc
        })
    }

    pub fn is_medicine(&self) -> bool {
        matches!(self.faculty, Faculty::Medicine)
    }
}

impl Resource for Catalog {
    fn collection_name() -> &'static str {
        "Catalogs"
    }

    fn key(&self) -> Document {
        doc! {"_id": self.id}
    }
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DisplayCatalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: bson::oid::ObjectId,
    pub name: String,
    pub faculty: Faculty,
    pub total_credit: f64,
    pub description: String,
    pub course_bank_names: Vec<String>,
}

impl From<Catalog> for DisplayCatalog {
    fn from(catalog: Catalog) -> Self {
        DisplayCatalog {
            id: catalog.id,
            name: catalog.name,
            faculty: catalog.faculty,
            total_credit: catalog.total_credit,
            description: catalog.description,
            course_bank_names: catalog
                .course_banks
                .into_iter()
                .map(|bank| bank.name)
                .collect(),
        }
    }
}
