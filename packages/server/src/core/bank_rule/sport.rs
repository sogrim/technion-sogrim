use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn sport(self) -> f32 {
        self.credit_overflow
            + self
                .degree_status
                .course_statuses
                .iter_mut()
                .filter(|course_status| course_status.valid_for_bank(&self.bank_name))
                // If the course is valid for the bank, and it's type is set (Some), then it must be set to sport (or else it would be invalid for the bank)
                .filter(|course_status| {
                    course_status.course.is_sport() || course_status.r#type.is_some()
                })
                .filter_map(|course_status| course_status.set_type(&self.bank_name).credit())
                .sum::<f32>()
    }
}
