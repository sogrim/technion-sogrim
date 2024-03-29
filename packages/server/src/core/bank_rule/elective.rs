use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn elective(self) -> f32 {
        self.credit_overflow
            + self
                .degree_status
                .course_statuses
                .iter_mut()
                .filter(|course_status| course_status.valid_for_bank(&self.bank_name))
                .filter(|course_status| {
                    course_status.semester.is_some() || course_status.course.credit != 0.0
                })
                .filter_map(|course_status| course_status.set_type(self.bank_name.clone()).credit())
                .sum::<f32>()
    }
}
