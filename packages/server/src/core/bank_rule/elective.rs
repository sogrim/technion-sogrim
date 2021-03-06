use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn elective(self) -> f32 {
        let mut sum_credit = self.credit_overflow;
        for course_status in &mut self.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && !(course_status.semester == None && course_status.course.credit == 0.0)
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
