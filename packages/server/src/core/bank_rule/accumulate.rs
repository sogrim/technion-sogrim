use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn accumulate_credit(mut self) {
        self.iterate_course_list();
    }

    pub fn accumulate_courses(mut self, count_courses: &mut usize) {
        let credit_info = self.iterate_course_list();
        *count_courses = credit_info.count_courses;
    }
}
