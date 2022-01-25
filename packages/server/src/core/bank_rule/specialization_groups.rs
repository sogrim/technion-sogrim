use std::collections::{HashMap, HashSet};

use crate::{
    core::types::{SpecializationGroup, SpecializationGroups},
    resources::course::CourseId,
};

use super::BankRuleHandler;

// General comment for the whole file
// sg = specialization_group
// sgs = specialization_groups

fn check_courses_assignment_for_sgs(
    sgs: &Vec<SpecializationGroup>,
    groups_indices: &Vec<u8>,
    course_id_to_sg_index: &HashMap<CourseId, u8>,
) -> bool {
    for sg_index in groups_indices {
        // check there are enough courses in this specialization group
        if (course_id_to_sg_index
            .values()
            .filter(|group| *group == sg_index)
            .count() as u8)
            < sgs[*sg_index as usize].courses_sum
        {
            // There are not enough courses in this assignment to complete sg requirement
            return false;
        }
        // check if the user completed the mandatory courses in sg
        if let Some(mandatory) = &sgs[*sg_index as usize].mandatory {
            for courses in mandatory {
                let mut completed_current_demand = false;
                for (course_id, group) in course_id_to_sg_index {
                    // check if the user completed one of courses
                    if group == sg_index && courses.contains(course_id) {
                        completed_current_demand = true;
                        break;
                    }
                }
                if !completed_current_demand {
                    return false;
                }
            }
        }
    }
    true
}

// This function is looking for a valid assignment for the courses which fulfill the sgs requirements
// If an assignment is found it returns it, None otherwise.
fn find_valid_assignment_for_courses(
    sgs: &Vec<SpecializationGroup>,
    groups_indices: &Vec<u8>,
    optional_sgs_for_course: &HashMap<CourseId, Vec<u8>>, // list of all optional sgs for each course
    course_id_to_sg_index: &mut HashMap<CourseId, u8>,
    course_index: usize, // course_index-th element in optional_sgs_for_course
) -> Option<HashMap<CourseId, u8>> {
    if course_index >= optional_sgs_for_course.len() {
        if check_courses_assignment_for_sgs(sgs, groups_indices, course_id_to_sg_index) {
            return Some(course_id_to_sg_index.clone());
        }
    }
    if let Some((course_id, optional_groups)) = optional_sgs_for_course.iter().nth(course_index) {
        for sg_index in optional_groups {
            course_id_to_sg_index.insert(course_id.clone(), *sg_index);
            if let Some(valid_assignment) = find_valid_assignment_for_courses(
                sgs,
                groups_indices,
                optional_sgs_for_course,
                course_id_to_sg_index,
                course_index + 1,
            ) {
                return Some(valid_assignment);
            }
        }
    }
    None
}

fn check_if_completed_groups(
    sgs: &Vec<SpecializationGroup>,
    groups_indices: &Vec<u8>,
    courses: &[CourseId],
) -> Option<HashMap<CourseId, u8>> {
    let mut optional_sgs_for_course = HashMap::<CourseId, Vec<u8>>::new();
    for course_id in courses {
        let mut relevant_groups_for_course = Vec::new();
        for sg_index in groups_indices {
            if sgs[*sg_index as usize].course_list.contains(course_id) {
                relevant_groups_for_course.push(*sg_index);
            }
        }
        if !relevant_groups_for_course.is_empty() {
            // only this subset specialization groups consist course_id
            optional_sgs_for_course.insert(course_id.clone(), relevant_groups_for_course);
        }
    }

    let mut courses_assignment = HashMap::new();
    find_valid_assignment_for_courses(
        sgs,
        groups_indices,
        &optional_sgs_for_course,
        &mut courses_assignment,
        0,
    )
}

// generates all subsets of size specialization_groups.groups_number and checks if one of them is fulfilled
fn generate_subsets(
    sgs: &Vec<SpecializationGroup>,
    required_number_of_groups: u8,
    sg_index: u8,
    groups_indices: &mut Vec<u8>,
    courses: &[CourseId],
) -> Option<HashMap<CourseId, u8>> {
    if groups_indices.len() as u8 == required_number_of_groups {
        return check_if_completed_groups(sgs, groups_indices, courses);
    }

    if sg_index >= sgs.len() as u8 {
        return None;
    }

    // current group is included
    groups_indices.push(sg_index);
    if let Some(valid_assignment) = generate_subsets(
        sgs,
        required_number_of_groups,
        sg_index + 1,
        groups_indices,
        courses,
    ) {
        return Some(valid_assignment);
    }

    // current group is excluded
    groups_indices.pop();
    return generate_subsets(
        sgs,
        required_number_of_groups,
        sg_index + 1,
        groups_indices,
        courses,
    );
}

fn run_exhaustive_search(
    sgs: &SpecializationGroups,
    courses: Vec<CourseId>, // list of all courses the user completed in specialization groups bank
) -> Option<HashMap<CourseId, u8>> {
    generate_subsets(
        &sgs.groups_list,
        sgs.groups_number,
        0,
        &mut Vec::new(),
        &courses,
    )
}

impl<'a> BankRuleHandler<'a> {
    pub fn specialization_group(
        mut self,
        sgs: &SpecializationGroups,
        completed_groups: &mut Vec<String>,
    ) -> f32 {
        let credit_info = self.iterate_course_list();
        let mut completed_courses = Vec::new();
        for (course_id_in_list, course_id_done_by_user) in credit_info.handled_courses {
            if let Some(course_status) = self.user.get_course_status(&course_id_done_by_user) {
                if course_status.passed() {
                    completed_courses.push(course_id_in_list);
                }
            }
        }

        let valid_assignment_for_courses = run_exhaustive_search(&sgs, completed_courses);

        // The set is to prevent duplications
        let mut sgs_names = HashSet::new();
        if let Some(valid_assignment) = valid_assignment_for_courses {
            for (course_id, sg_index) in valid_assignment {
                if let Some(course_status) = self.user.get_mut_course_status(&course_id) {
                    course_status
                        .set_specialization_group_name(&sgs.groups_list[sg_index as usize].name);
                    sgs_names.insert(&sgs.groups_list[sg_index as usize].name);
                }
            }
        }
        for sg_name in sgs_names {
            completed_groups.push(sg_name.clone());
        }

        credit_info.sum_credit
    }
}
