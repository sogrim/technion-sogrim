use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn elective(self) {
        self.degree_status
            .course_statuses
            .iter_mut()
            .filter(|course_status| course_status.valid_for_bank(&self.bank_name))
            .filter(|course_status| {
                course_status.semester.is_some() || course_status.course.credit != 0.0
            })
            .for_each(|course_status| {
                course_status.set_type(self.bank_name.clone());
            })
    }
}
