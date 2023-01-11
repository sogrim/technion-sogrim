use crate::resources::course::CourseId;

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn malag(self, malag_courses: &[CourseId]) -> f32 {
        self.credit_overflow
            + self
                .degree_status
                .course_statuses
                .iter_mut()
                .filter(|course_status| course_status.valid_for_bank(&self.bank_name))
                .filter(|course_status| {
                    malag_courses.contains(&course_status.course.id)
                        || course_status.r#type.is_some()
                        // TODO: maybe think of a better way to do this
                        || (course_status.course.id.starts_with("324") 
                            && course_status.course.credit == 2.0
                            && !course_status.is_language())
                })
                .filter_map(|course_status| course_status.set_type(&self.bank_name).credit())
                .sum::<f32>()
    }
}
