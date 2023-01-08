use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn accumulate_credit(mut self) -> f32 {
        let credit_info = self.iterate_course_list();
        credit_info.sum_credit
    }

    pub fn accumulate_courses(mut self, count_courses: &mut usize) -> f32 {
        let credit_info = self.iterate_course_list();
        *count_courses = credit_info.count_courses;
        credit_info.sum_credit
    }
}
