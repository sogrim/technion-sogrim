use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn sport(self) -> f32 {
        let mut sum_credit = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && (course_status.is_sport() || course_status.r#type.is_some())
            // If type is not none it means valid_for_bank returns true because the user modified this course to be sport
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
