use crate::core::types::SpecializationGroups;

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn specialization_group(
        mut self,
        specialization_groups: &SpecializationGroups,
        completed_groups: &mut Vec<String>,
    ) -> f32 {
        let credit_info = self.iterate_course_list();
        for specialization_group in &specialization_groups.groups_list {
            //check if the user completed all the specialization groups requirements
            let mut completed_group = true;
            if let Some(mandatory) = &specialization_group.mandatory {
                for courses in mandatory {
                    let mut completed_current_demand = false;
                    for course_id in courses {
                        // check if the user completed one of courses
                        if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                            if let Some(course_status) = self.user.get_course_status(course_id) {
                                if course_status.passed()
                                    && course_status.specialization_group_name.is_none()
                                {
                                    completed_current_demand = true;
                                    break;
                                }
                            }
                        }
                    }
                    completed_group &= completed_current_demand;
                    if !completed_group {
                        // The user didn't completed one of the mandatory courses
                        break;
                    }
                }
            }
            if !completed_group {
                continue;
            }
            let mut chosen_courses = Vec::new();
            for course_id in &specialization_group.course_list {
                if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                    if let Some(course_status) = self.user.get_course_status(course_id) {
                        if course_status.passed()
                            && course_status.specialization_group_name.is_none()
                        {
                            chosen_courses.push(course_id.clone());
                        }
                        if (chosen_courses.len() as u8) == specialization_group.courses_sum {
                            // Until we implement exhaustive search on the specialization groups we should add this condition, so we cover more cases.
                            // when we find enough courses to finish this specialization group we don't need to check more courses, and then those courses can be taken to other groups.
                            break;
                        }
                    }
                }
            }
            completed_group &= (chosen_courses.len() as u8) == specialization_group.courses_sum;
            if completed_group {
                completed_groups.push(specialization_group.name.clone());
                for course_id in chosen_courses {
                    let course_status = self.user.get_mut_course_status(&course_id);
                    if let Some(course_status) = course_status {
                        course_status.set_specialization_group_name(&specialization_group.name);
                    }
                }
            }
        }

        credit_info.sum_credit
    }
}
