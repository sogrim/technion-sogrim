use crate::core::types::Chain;

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn chain(mut self, chains: &[Chain], chain_done: &mut Vec<String>) -> f32 {
        let credit_info = self.iterate_course_list();
        chains
            .iter()
            // Check if all courses in the chain are completed
            .filter(|chain| {
                chain.iter().all(|course_id| {
                    credit_info
                        .handled_courses
                        .get(course_id)
                        .and_then(|course_id| {
                            self.degree_status
                                .get_course_status(course_id)
                                .map(|course_status| course_status.completed())
                        })
                        .unwrap_or(false)
                })
            })
            // Map the course ids in the chain to course names
            .for_each(|chain| {
                chain.iter().for_each(|course_id| {
                    credit_info
                        .handled_courses
                        .get(course_id)
                        .and_then(|course_id| {
                            self.degree_status
                                .get_course_status(course_id)
                                .map(|course_status| {
                                    chain_done.push(course_status.course.name.clone());
                                })
                        });
                });
            });

        credit_info.sum_credit
    }
}
