pub mod calculate_overflows;
pub mod compute_bank;
pub mod compute_status;
pub mod handle_overflow;
pub mod preprocessing;

use std::collections::HashMap;

use crate::core::types::Requirement;
use crate::resources::{
    catalog::Catalog,
    course::{Course, CourseBank, CourseId, CourseStatus},
    user::UserDetails,
};
use serde::{Deserialize, Serialize};

use super::toposort;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct DegreeStatus {
    pub course_statuses: Vec<CourseStatus>,
    pub course_bank_requirements: Vec<Requirement>,
    pub overflow_msgs: Vec<String>,
    pub total_credit: f32,
}

pub struct DegreeStatusHandler<'a> {
    pub user: &'a mut UserDetails,
    pub course_banks: Vec<CourseBank>,
    pub catalog: Catalog,
    pub courses: HashMap<CourseId, Course>,
    pub malag_courses: Vec<CourseId>,
    pub credit_overflow_map: HashMap<String, f32>,
    pub missing_credit_map: HashMap<String, f32>,
    pub courses_overflow_map: HashMap<String, f32>,
}

impl<'a> DegreeStatusHandler<'a> {
    fn find_next_bank(&self, bank_name: &str) -> Option<&CourseBank> {
        for overflow_rule in &self.catalog.credit_overflows {
            if overflow_rule.from == bank_name {
                return self.catalog.get_course_bank_by_name(&overflow_rule.to);
            }
        }
        None
    }
    fn find_next_bank_with_credit_requirement(&self, bank_name: &str) -> Option<String> {
        let mut current_bank = bank_name.to_string();
        while let Some(course_bank) = self.find_next_bank(&current_bank) {
            if course_bank.credit.is_none() {
                current_bank = course_bank.name.clone();
            } else {
                return Some(course_bank.name.clone());
            }
        }
        None
    }

    pub fn get_modified_courses(&self, bank_name: &str) -> Vec<CourseId> {
        let mut modified_courses = Vec::new();
        for course_status in &self.user.degree_status.course_statuses {
            if course_status.modified && course_status.r#type == Some(bank_name.to_string()) {
                modified_courses.push(course_status.course.id.clone());
            }
        }
        modified_courses
    }

    fn calculate_credit_leftovers(&self) -> f32 {
        let mut sum_credit = 0.0;
        for credit_overflow in self.credit_overflow_map.values() {
            sum_credit += *credit_overflow;
        }
        sum_credit
    }
}

pub fn compute(
    mut catalog: Catalog,
    courses: HashMap<CourseId, Course>,
    malag_courses: Vec<CourseId>,
    user: &mut UserDetails,
) {
    let course_banks = toposort::set_order(&catalog.course_banks, &catalog.credit_overflows);

    // prepare the data for user status computation
    preprocessing::compute(user, &mut catalog);

    DegreeStatusHandler {
        user,
        course_banks,
        catalog,
        courses,
        malag_courses,
        credit_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    }
    .compute_status();
}
