use crate::{
    core::{
        credit_transfer_graph::find_traversal_order,
        types::{CreditOverflow, Rule},
    },
    db::Resource,
    resources::course::{to_8digit, CourseBank},
};
use bson::{doc, Document};
use regex::Regex;
use serde::{self, Deserialize, Serialize};
use std::collections::HashMap;

use super::course::CourseId;

pub(crate) type OptionalReplacements = Vec<CourseId>;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub enum Faculty {
    #[default]
    Unknown,
    ComputerScience,
    DataAndDecisionScience,
    ElectricalEngineering,
    Medicine,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Catalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"), default)]
    pub id: bson::oid::ObjectId,
    pub name: String,
    pub faculty: Faculty,
    pub total_credit: f64,
    pub description: String,
    pub course_banks: Vec<CourseBank>,
    pub credit_overflows: Vec<CreditOverflow>,
    pub course_to_bank: HashMap<CourseId, String>,
    pub catalog_replacements: HashMap<CourseId, OptionalReplacements>, // All replacements which are mentioned in the catalog
    pub common_replacements: HashMap<CourseId, OptionalReplacements>, // Common replacement which usually approved by the coordinators
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
        find_traversal_order(self)
    }

    pub fn get_all_course_ids(&self) -> Vec<CourseId> {
        self.course_to_bank.clone().into_keys().collect()
    }

    pub fn is_medicine(&self) -> bool {
        matches!(self.faculty, Faculty::Medicine)
    }

    // Iterate over all banks and replace the course with the replacement
    pub fn replace_courses(&mut self, course: &CourseId, replacement: &CourseId) {
        if let Some(bank_name) = self.course_to_bank.get(course) {
            self.course_to_bank
                .insert(replacement.clone(), bank_name.clone());
            self.course_to_bank.remove(course);
        }

        for bank in self.course_banks.iter_mut() {
            bank.replace_course(course.clone(), replacement.clone());
        }
    }

    /// Normalize all 6-digit course IDs in the catalog to 8-digit format.
    pub fn normalize_course_ids(&mut self) {
        fn normalize_id(id: &mut CourseId) {
            if id.len() == 6 {
                *id = to_8digit(id);
            }
        }

        fn normalize_replacements_map(map: &mut HashMap<CourseId, OptionalReplacements>) {
            let entries: Vec<_> = map.drain().collect();
            for (mut key, mut values) in entries {
                normalize_id(&mut key);
                for v in values.iter_mut() {
                    normalize_id(v);
                }
                map.insert(key, values);
            }
        }

        // course_to_bank keys
        let entries: Vec<_> = self.course_to_bank.drain().collect();
        for (mut key, value) in entries {
            normalize_id(&mut key);
            self.course_to_bank.insert(key, value);
        }

        // catalog_replacements and common_replacements (keys + values)
        normalize_replacements_map(&mut self.catalog_replacements);
        normalize_replacements_map(&mut self.common_replacements);

        // course_banks rules
        for bank in self.course_banks.iter_mut() {
            match &mut bank.rule {
                Rule::Chains(chains) => {
                    for chain in chains.iter_mut() {
                        for id in chain.iter_mut() {
                            normalize_id(id);
                        }
                    }
                }
                Rule::SpecializationGroups(groups) => {
                    for group in groups.groups_list.iter_mut() {
                        for id in group.course_list.iter_mut() {
                            normalize_id(id);
                        }
                        if let Some(mandatory) = &mut group.mandatory {
                            for replacements in mandatory.iter_mut() {
                                for id in replacements.iter_mut() {
                                    normalize_id(id);
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        }
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
