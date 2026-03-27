pub mod compute_bank;
pub mod compute_status;
pub mod overflow;
pub mod postprocessing;
pub mod preprocessing;

use std::collections::HashMap;

use crate::core::types::Requirement;
use crate::resources::{
    catalog::Catalog,
    course::{Course, CourseBank, CourseId, CourseState, CourseStatus},
};
use serde::{Deserialize, Serialize};

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
        self.course_statuses
            .iter()
            .find(|&course_status| course_status.course.id == id)
    }

    pub fn get_mut_course_status(&mut self, id: &str) -> Option<&mut CourseStatus> {
        // returns the first course_status with the given id
        self.course_statuses
            .iter_mut()
            .find(|course_status| course_status.course.id == id)
    }

    // This function sets the state for all courses where their state is "in progress" to "complete"
    // and returns a list of all courses which were changed, (CourseId, Semester) is a key for each courseStatus.
    pub fn set_in_progress_to_complete(&mut self) -> Vec<(CourseId, Option<String>)> {
        self.course_statuses
            .iter_mut()
            .filter(|course_status| course_status.state == Some(CourseState::InProgress))
            .map(|course_status| {
                course_status.state = Some(CourseState::Complete);
                (
                    course_status.course.id.clone(),
                    course_status.semester.clone(),
                )
            })
            .collect()
    }

    // This function gets a list of courses and sets their state to "in progress"
    pub fn set_to_in_progress(&mut self, course_list: Vec<(CourseId, Option<String>)>) {
        self.course_statuses
            .iter_mut()
            .filter(|course_status| {
                course_list.contains(&(
                    course_status.course.id.clone(),
                    course_status.semester.clone(),
                )) && course_status.state == Some(CourseState::Complete)
            })
            .for_each(|course_status| {
                course_status.state = Some(CourseState::InProgress);
            })
    }

    pub fn fill_tags(&mut self, courses: &[Course]) {
        self.course_statuses.iter_mut().for_each(|course_status| {
            course_status.course.tags = courses
                .iter()
                .find(|course| course.id == course_status.course.id)
                .and_then(|course| course.tags.clone());
        });
    }

    pub fn get_all_taken_courses_for_bank(&self, bank_name: &str) -> Vec<CourseId> {
        self.course_statuses
            .iter()
            .filter(|course_status| course_status.r#type == Some(bank_name.to_string()))
            .map(|course_status| course_status.course.id.clone())
            .collect()
    }

    pub fn get_all_completed_courses_for_bank(&self, bank_name: &str) -> Vec<CourseId> {
        self.course_statuses
            .iter()
            .filter(|course_status| {
                course_status.r#type == Some(bank_name.to_string()) && course_status.completed()
            })
            .map(|course_status| course_status.course.id.clone())
            .collect()
    }
}

pub struct DegreeStatusHandler<'a> {
    degree_status: &'a mut DegreeStatus,
    course_banks: Vec<CourseBank>,
    catalog: &'a Catalog,
    courses: HashMap<CourseId, Course>,
    credit_overflow_map: HashMap<String, f32>,
    missing_credit_map: HashMap<String, f32>,
    courses_overflow_map: HashMap<String, f32>,
}

impl<'a> DegreeStatusHandler<'a> {
    fn find_next_bank_with_credit_requirement(&self, bank_name: &str) -> Option<String> {
        let find_next_bank = |bank_name: &str| {
            self.catalog
                .credit_overflows
                .iter()
                .find(|overflow| overflow.from == bank_name)
                .and_then(|overflow| self.catalog.get_course_bank_by_name(&overflow.to))
        };
        let mut current_bank = bank_name.to_string();
        while let Some(course_bank) = find_next_bank(&current_bank) {
            if course_bank.credit.is_none() {
                current_bank = course_bank.name.clone();
            } else {
                return Some(course_bank.name.clone());
            }
        }
        None
    }
}

impl DegreeStatus {
    pub fn compute(&mut self, mut catalog: Catalog, courses: HashMap<CourseId, Course>) {
        // prepare the data for degree status computation
        self.preprocess(&mut catalog, &courses);

        let course_banks = catalog.get_bank_traversal_order();

        DegreeStatusHandler {
            degree_status: self,
            course_banks,
            catalog: &catalog,
            courses,
            credit_overflow_map: HashMap::new(),
            missing_credit_map: HashMap::new(),
            courses_overflow_map: HashMap::new(),
        }
        .compute_status();

        // process the data after degree status computation
        self.postprocess(&catalog);
    }
}
