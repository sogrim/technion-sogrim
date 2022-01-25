pub mod accumulate;
pub mod all;
pub mod chain;
pub mod elective;
pub mod iterate_courses;
pub mod malag;
pub mod specialization_groups;
pub mod sport;
#[allow(clippy::float_cmp)]
#[cfg(test)]
pub mod tests;

use std::collections::HashMap;

use crate::resources::{
    catalog::OptionalReplacements,
    course::{Course, CourseId, CourseStatus},
    user::UserDetails,
};

pub struct BankRuleHandler<'a> {
    pub user: &'a mut UserDetails,
    pub bank_name: String,
    pub course_list: Vec<CourseId>,
    pub courses: &'a HashMap<CourseId, Course>,
    pub credit_overflow: f32,
    pub courses_overflow: u32,
    pub catalog_replacements: &'a HashMap<CourseId, OptionalReplacements>,
    pub common_replacements: &'a HashMap<CourseId, OptionalReplacements>,
}

impl<'a> BankRuleHandler<'a> {
    // This function sets the type of the course and adds its credit to sum_credit.
    // Returns true if the credit have been added, false otherwise.
    pub fn set_type_and_add_credit(
        course_status: &mut CourseStatus,
        bank_name: String,
        sum_credit: &mut f32,
    ) -> bool {
        course_status.set_type(bank_name);
        if course_status.passed() {
            *sum_credit += course_status.course.credit;
            true
        } else {
            false
        }
    }
}
