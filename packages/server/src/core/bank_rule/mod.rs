pub mod accumulate;
pub mod all;
pub mod chain;
pub mod elective;
pub mod iterate_courses;
pub mod malag;
pub mod specialization_groups;
pub mod sport;
#[cfg(test)]
pub mod tests;

use std::collections::HashMap;

use crate::resources::course::{Course, CourseId};

use super::degree_status::DegreeStatus;

pub struct BankRuleHandler<'a> {
    pub degree_status: &'a mut DegreeStatus,
    pub bank_name: String,
    pub course_list: Vec<CourseId>,
    pub courses: &'a HashMap<CourseId, Course>,
    pub credit_overflow: f32,
    pub courses_overflow: usize,
}
