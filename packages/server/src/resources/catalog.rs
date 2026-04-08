use crate::{
    core::{credit_transfer_graph::find_traversal_order, types::CreditOverflow},
    db::Resource,
    resources::course::CourseBank,
};
use bson::{doc, Document};
use regex::Regex;
use serde::{self, Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::LazyLock;

static YEAR_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?P<year>\d{4})").unwrap());
static TRACK_NAME_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\s*\d{4}(-\d{4})?\s*").unwrap());

use super::course::{CourseId, CourseStatus};

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

impl Faculty {
    /// Returns the known course ID prefixes for this faculty.
    /// Can be extended per-faculty as needed.
    fn course_prefixes(&self) -> Vec<&str> {
        match self {
            Faculty::ComputerScience => vec!["0234", "0236"],
            _ => vec![],
        }
    }
}

impl Catalog {
    /// Returns course ID prefixes for this catalog, currently based on faculty.
    /// Can be extended in the future to also consider the track name.
    pub fn course_prefixes(&self) -> Vec<&str> {
        self.faculty.course_prefixes()
    }

    pub fn year(&self) -> usize {
        let default_year = 2018;
        YEAR_RE
            .captures(&self.name)
            .map(|cap| cap["year"].parse::<usize>().unwrap_or(default_year))
            .unwrap_or(default_year)
    }

    pub fn get_course_list(&self, name: &str) -> Vec<CourseId> {
        let mut course_list_for_bank = Vec::new();
        for (course_id, bank_name) in &self.course_to_bank {
            if *bank_name == name {
                course_list_for_bank.push(course_id.clone());
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

    /// Returns the name of the accumulate bank with the most courses in `course_to_bank`.
    /// Used to determine where prefix-matched, non-catalog courses should be counted.
    pub fn default_accumulate_bank(&self) -> Option<String> {
        let accumulate_bank_names: Vec<&str> = self
            .course_banks
            .iter()
            .filter(|bank| bank.rule.is_accumulate())
            .map(|bank| bank.name.as_str())
            .collect();

        accumulate_bank_names
            .iter()
            .max_by_key(|&&bank_name| {
                self.course_to_bank
                    .values()
                    .filter(|v| v.as_str() == bank_name)
                    .count()
            })
            .map(|&name| name.to_string())
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

    /// Returns the track name by stripping the year portion from a catalog name string.
    /// E.g. "מדמח תלת שנתי 2022-2023" → "מדמח תלת שנתי"
    pub fn track_name_from_str(name: &str) -> String {
        TRACK_NAME_RE
            .replace_all(name, "")
            .trim()
            .to_string()
    }

    pub fn track_name(&self) -> String {
        Self::track_name_from_str(&self.name)
    }

    /// Enrich this catalog with courses from sibling catalogs (same track, different years).
    /// Only courses from AccumulateCredit and AccumulateCourses banks are merged.
    /// The current catalog always takes priority — existing course_to_bank entries are never overridden.
    pub fn enrich_with_sibling_courses(&mut self, siblings: &[Catalog]) {
        let accumulate_bank_names: HashSet<&str> = self
            .course_banks
            .iter()
            .filter(|bank| bank.rule.is_accumulate())
            .map(|bank| bank.name.as_str())
            .collect();

        for sibling in siblings {
            if sibling.id == self.id {
                // Skip current catalog
                continue;
            }

            let sibling_accumulate_banks: HashSet<&str> = sibling
                .course_banks
                .iter()
                .filter(|bank| bank.rule.is_accumulate())
                .map(|bank| bank.name.as_str())
                .collect();

            for (course_id, sibling_bank_name) in &sibling.course_to_bank {
                // Current catalog always takes priority
                if self.course_to_bank.contains_key(course_id) {
                    continue;
                }
                // Only merge from accumulate-type banks in the sibling
                if !sibling_accumulate_banks.contains(sibling_bank_name.as_str()) {
                    continue;
                }
                // Only merge if we have a matching accumulate bank with this name
                if !accumulate_bank_names.contains(sibling_bank_name.as_str()) {
                    continue;
                }
                self.course_to_bank
                    .insert(course_id.clone(), sibling_bank_name.clone());
            }
        }
    }

    /// Enrich this catalog with student courses that match the faculty's course prefixes
    /// but are not already in `course_to_bank`. These courses are assigned to the
    /// accumulate bank with the most courses (the "default" accumulate bank).
    pub fn enrich_with_prefix_courses(&mut self, student_courses: &[CourseStatus]) {
        let prefixes = self.course_prefixes();
        if prefixes.is_empty() {
            return;
        }
        let prefixes: Vec<String> = prefixes.into_iter().map(String::from).collect();
        let Some(default_bank) = self.default_accumulate_bank() else {
            return;
        };

        for course_status in student_courses {
            let course_id = &course_status.course.id;
            if self.course_to_bank.contains_key(course_id) {
                continue;
            }
            if prefixes
                .iter()
                .any(|prefix| course_id.starts_with(prefix.as_str()))
            {
                self.course_to_bank
                    .insert(course_id.clone(), default_bank.clone());
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
