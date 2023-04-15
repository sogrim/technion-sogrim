use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn accumulate_credit(mut self) {
        self.iterate_course_list();
    }

    pub fn accumulate_courses(mut self, count_courses: &mut usize) {
        self.iterate_course_list();
        *count_courses =
            self.courses_overflow + self.degree_status.count_courses_for_bank(&self.bank_name);
    }
}
