pub mod compute_bank;
pub mod compute_status;
pub mod overflow;
pub mod postprocessing;
pub mod preprocessing;

use std::collections::{HashMap, HashSet};

use crate::core::types::Requirement;
use crate::resources::{
    catalog::Catalog,
    course::{AcademicSemester, Course, CourseBank, CourseId, CourseState, CourseStatus, Grade},
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
    pub fn get_course_status(&self, id: &CourseId) -> Option<&CourseStatus> {
        // returns the first course_status with the given id
        self.course_statuses
            .iter()
            .find(|&course_status| course_status.course.id == *id)
    }

    pub fn get_mut_course_status(&mut self, id: &CourseId) -> Option<&mut CourseStatus> {
        // returns the first course_status with the given id
        self.course_statuses
            .iter_mut()
            .find(|course_status| course_status.course.id == *id)
    }

    // This function sets the state for all courses where their state is "in progress" to "complete"
    // and returns a list of all courses which were changed, (CourseId, Semester) is a key for each courseStatus.
    pub fn set_in_progress_to_complete(&mut self) -> Vec<(CourseId, Option<AcademicSemester>)> {
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
    pub fn set_to_in_progress(&mut self, course_list: Vec<(CourseId, Option<AcademicSemester>)>) {
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

impl DegreeStatusHandler<'_> {
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
    /// Collect social courses ("פעילות חברתית") from course_statuses.
    /// Social courses are used to let the user allocate the extra credit they have.
    fn extract_social_courses(&mut self) -> Vec<CourseStatus> {
        self.course_statuses
            .extract_if(.., |cs| cs.course.is_social())
            .collect()
    }

    fn extract_repetitions(&mut self) -> Vec<CourseStatus> {
        // Repeatable courses (sport, social, and physical-education / arts
        // ensembles — see Course::is_repeatable) may legitimately recur — a
        // student can take several of them, sometimes sharing the same course id
        // across semesters — so they must bypass the dedup below. They can't go
        // through `kept`, which is keyed by course id, because same-id entries
        // would silently overwrite each other and drop all but one. They also stay
        // in `course_statuses` so their bank can count them during compute_status.
        let exempt_courses = self
            .course_statuses
            .extract_if(.., |course_status| course_status.course.is_repeatable())
            .collect::<Vec<_>>();

        let mut kept = HashMap::new();
        let mut removed = Vec::new();

        let unique_course_ids = self
            .course_statuses
            .iter()
            .map(|course_status| course_status.course.id.clone())
            .collect::<HashSet<CourseId>>();

        unique_course_ids.iter().for_each(|unique_course_id| {
            self.course_statuses
                .iter()
                .filter(|course_status| &course_status.course.id == unique_course_id)
                .for_each(|course_status| {
                    let Some(entry) = kept.get_mut(unique_course_id) else {
                        kept.insert(unique_course_id.clone(), course_status.clone());
                        return;
                    };

                    if entry.grade.is_none() {
                        // The existing entry is ungraded, so we replace it with the new one which may be graded.
                        removed.push(entry.clone());
                        *entry = course_status.clone();
                    } else if course_status.grade.is_none() {
                        // The existing entry is graded, but the new course_status is ungraded, so we keep the existing entry.
                        removed.push(course_status.clone());
                    } else {
                        if course_status.grade == Some(Grade::NotComplete) {
                            // The new course_status is not complete (usually means the student didn't take the test), so we keep the existing entry.
                            removed.push(course_status.clone());
                            return;
                        }

                        // Both attempts are graded — keep the one from the latest semester.
                        if course_status.semester_order_key() > entry.semester_order_key() {
                            removed.push(entry.clone());
                            *entry = course_status.clone();
                        } else {
                            removed.push(course_status.clone());
                        }
                    }
                });
        });

        self.course_statuses = kept.into_values().collect();
        // Sport/social courses were never deduped — put every one of them back.
        self.course_statuses.extend(exempt_courses);
        removed
    }

    pub fn compute(&mut self, mut catalog: Catalog, mut courses: HashMap<CourseId, Course>) {
        self.preprocess(&mut catalog, &mut courses);

        // Extract social courses and superseded retake attempts, then remove them so they don't
        // affect the compute status logic; both are restored afterward for display.
        let social_courses = self.extract_social_courses();
        let repetitions = self.extract_repetitions();

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

        self.course_statuses.extend(social_courses);
        self.course_statuses
            .extend(repetitions.into_iter().map(|mut repetition| {
                repetition.is_repetition = true;
                repetition
            }));

        self.postprocess(&catalog);
    }
}

#[cfg(test)]
#[path = "repetitions_tests.rs"]
mod repetitions_tests;
