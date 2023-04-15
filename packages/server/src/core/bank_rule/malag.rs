use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn malag(self) {
        self.degree_status
            .course_statuses
            .iter_mut()
            .filter(|course_status| course_status.valid_for_bank(&self.bank_name))
            .filter(|course_status| {
                // If the course is valid for the bank, and it's type is set (Some), then it must be set to malag (or else it would be invalid for the bank)
                course_status.course.is_malag() || course_status.r#type.is_some()
            })
            .for_each(|course_status| {
                course_status.set_type(&self.bank_name);
            })
    }
}
