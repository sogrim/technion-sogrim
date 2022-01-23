use std::collections::HashMap;

use crate::{
    core::types::{SpecializationGroup, SpecializationGroups},
    resources::course::CourseId,
};

use super::BankRuleHandler;

// generates all subsets of size specialization_groups.groups_number and check if one of them is fulfilled
fn generate_subsets(
    specialization_groups: &HashMap<usize, &SpecializationGroup>,
    required_number_of_groups: usize,
    index: u32,
    groups_indices: &mut Vec<u32>,
    courses: &HashMap<CourseId, CourseId>,
) {
    if groups_indices.len() == required_number_of_groups {
        return;
    }

    if index > specialization_groups.len() as u32 {
        return;
    }

    // current group in included
    groups_indices.push(index);
    generate_subsets(
        specialization_groups,
        required_number_of_groups,
        index + 1,
        groups_indices,
        courses,
    );

    // current group is excluded
    groups_indices.pop();
    generate_subsets(
        specialization_groups,
        required_number_of_groups,
        index + 1,
        groups_indices,
        courses,
    );
}

fn exhaustive_search(
    courses: &HashMap<CourseId, CourseId>,
    specialization_groups: &SpecializationGroups,
) {
    let mut specialization_groups_indices = HashMap::new();
    for (index, specialization_group) in specialization_groups.groups_list.iter().enumerate() {
        specialization_groups_indices.insert(index, specialization_group);
    }
}

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
