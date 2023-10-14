use crate::core::types::Chain;

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn chain(mut self, chains: &[Chain], chain_done: &mut Vec<String>) -> f32 {
        let credit_info = self.iterate_course_list();
        let completed_courses = self
            .degree_status
            .get_all_completed_courses_for_bank(&self.bank_name);

        println!("completed_courses: {:#?}", completed_courses);
        println!("chains: {:#?}", chains);

        for chain in chains {
            let chain_complete = chain
                .iter()
                .all(|course_id| completed_courses.contains(course_id));
            if chain_complete {
                *chain_done = chain
                    .iter()
                    .filter_map(|course| {
                        self.degree_status
                            .get_course_status(course)
                            .map(|course_status| course_status.course.name.clone())
                    })
                    .collect();

                break;
            }
        }

        credit_info.sum_credit
    }
}
