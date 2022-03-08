use crate::resources::course::CourseId;

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    // TODO: remove this when removing the condition in the if statement
    #[allow(clippy::float_cmp)]
    pub fn malag(self, malag_courses: &[CourseId]) -> f32 {
        let mut sum_credit = self.credit_overflow;
        for course_status in &mut self.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && (malag_courses.contains(&course_status.course.id)
            // TODO: remove this line after we get the answer from the coordinates
            || (course_status.course.id.starts_with("324") && course_status.course.credit == 2.0)
            || course_status.r#type.is_some())
            // If type is not none it means valid_for_bank returns true because the user modified this course to be malag
            {
                Self::set_type_and_add_credit(
                    course_status,
                    self.bank_name.clone(),
                    &mut sum_credit,
                );
            }
        }
        sum_credit
    }
}
