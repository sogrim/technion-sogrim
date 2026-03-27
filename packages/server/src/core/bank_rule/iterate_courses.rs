use crate::core::types::CreditInfo;

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn iterate_course_list(&mut self) -> CreditInfo {
        // return sum_credit, count_courses, missing_points
        let mut sum_credit = self.credit_overflow;
        let mut count_courses = self.courses_overflow;
        self.degree_status
            .course_statuses
            .iter_mut()
            .filter(|course_status| course_status.valid_for_bank(&self.bank_name))
            .filter(|course_status| {
                self.course_list.contains(&course_status.course.id)
                    || course_status.r#type == Some(self.bank_name.clone())
            })
            .for_each(|course_status| {
                course_status.set_type(&self.bank_name);
                if let Some(credit) = course_status.credit() {
                    sum_credit += credit;
                    count_courses += 1;
                }
            });

        CreditInfo {
            sum_credit,
            count_courses,
        }
    }
}
