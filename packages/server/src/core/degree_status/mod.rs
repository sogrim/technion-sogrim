pub mod compute_bank;
pub mod compute_status;
pub mod overflow;
pub mod preprocessing;

use std::collections::HashMap;

use crate::core::types::Requirement;
use crate::resources::{
    catalog::Catalog,
    course::{Course, CourseBank, CourseId, CourseState, CourseStatus},
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

impl DegreeStatus {
    pub fn get_course_status(&self, id: &str) -> Option<&CourseStatus> {
        // returns the first course_status with the given id
        for course_status in self.course_statuses.iter() {
            if course_status.course.id == id {
                return Some(course_status);
            }
        }
        None
    }

    pub fn get_mut_course_status(&mut self, id: &str) -> Option<&mut CourseStatus> {
        // returns the first course_status with the given id
        for course_status in &mut self.course_statuses.iter_mut() {
            if course_status.course.id == id {
                return Some(course_status);
            }
        }
        None
    }

    // This function sets the state for all courses where their state is "in progress" to "complete"
    // and returns a list of all courses which were changed, (CourseId, Semester) is a key for each courseStatus.
    pub fn set_in_progress_to_complete(&mut self) -> Vec<(CourseId, Option<String>)> {
        let mut changed_course_statuses = Vec::new();
        for course_status in self.course_statuses.iter_mut() {
            if course_status.state == Some(CourseState::InProgress) {
                changed_course_statuses.push((
                    course_status.course.id.clone(),
                    course_status.semester.clone(),
                ));
                course_status.state = Some(CourseState::Complete);
            }
        }
        changed_course_statuses
    }

    // This function gets a list of courses and sets their state to "in progress"
    pub fn set_to_in_progress(&mut self, course_list: Vec<(CourseId, Option<String>)>) {
        for course_status in self.course_statuses.iter_mut() {
            if course_list.contains(&(
                course_status.course.id.clone(),
                course_status.semester.clone(),
            )) && course_status.state == Some(CourseState::Complete)
            {
                course_status.state = Some(CourseState::InProgress);
            }
        }
    }
}

pub struct DegreeStatusHandler<'a> {
    pub degree_status: &'a mut DegreeStatus,
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

    fn calculate_credit_leftovers(&self) -> f32 {
        let mut sum_credit = 0.0;
        for credit_overflow in self.credit_overflow_map.values() {
            sum_credit += *credit_overflow;
        }
        sum_credit
    }
}

impl DegreeStatus {
    pub fn compute(
        &mut self,
        mut catalog: Catalog,
        courses: HashMap<CourseId, Course>,
        malag_courses: Vec<CourseId>,
    ) {
        let course_banks = toposort::set_order(&catalog.course_banks, &catalog.credit_overflows);

        // prepare the data for degree status computation
        self.preprocess(&mut catalog);

        DegreeStatusHandler {
            degree_status: self,
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
}
