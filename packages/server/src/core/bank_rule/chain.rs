use crate::{
    core::types::Chain,
    resources::course::{CourseId, CourseStatus},
};

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn chain(mut self, chains: &[Chain], chain_done: &mut Vec<String>) -> f32 {
        let credit_info = self.iterate_course_list();
        let map_to_actual_course = |course_id: &CourseId| -> Option<&CourseStatus> {
            credit_info
                .handled_courses
                .get(course_id)
                .and_then(|course_id| self.degree_status.get_course_status(course_id))
        };
        for chain in chains {
            let chain_complete = chain.iter().all(|course_id| {
                map_to_actual_course(course_id)
                    .map(|course_status| course_status.completed())
                    .unwrap_or(false)
            });
            if chain_complete {
                *chain_done = chain
                    .iter()
                    .filter_map(map_to_actual_course)
                    .map(|course_status| course_status.course.name.clone())
                    .collect();

                break;
            }
        }

        credit_info.sum_credit
    }
}
