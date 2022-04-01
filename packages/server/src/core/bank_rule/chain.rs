use crate::core::types::Chain;

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn chain(mut self, chains: &[Chain], chain_done: &mut Vec<String>) -> f32 {
        let credit_info = self.iterate_course_list();
        for chain in chains {
            //check if the user completed one of the chains.
            let mut completed_chain = true;
            for course_id in chain {
                if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                    if let Some(course_status) = self.degree_status.get_course_status(course_id) {
                        if course_status.completed() {
                            chain_done.push(course_status.course.name.clone());
                        } else {
                            completed_chain = false;
                            break;
                        }
                    }
                } else {
                    completed_chain = false;
                    break;
                }
            }
            if completed_chain {
                return credit_info.sum_credit;
            } else {
                chain_done.clear();
            }
        }
        credit_info.sum_credit
    }
}
