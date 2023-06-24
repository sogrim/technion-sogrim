use std::collections::{HashMap, HashSet};

use crate::{
    core::types::{SpecializationGroup, SpecializationGroups},
    resources::course::CourseId,
};

// General comment for the whole file
// sg = specialization_group
// sgs = specialization_groups

fn get_groups_indices(course_id_to_sg_index: &HashMap<CourseId, usize>) -> Vec<usize> {
    let mut uniques = HashSet::new();
    let mut indices = course_id_to_sg_index
        .clone()
        .into_values()
        .collect::<Vec<_>>();
    indices.retain(|e| uniques.insert(*e));
    indices
}

pub fn get_complete_sgs_indices(
    sgs: &[SpecializationGroup],
    course_id_to_sg_index: &HashMap<CourseId, usize>,
) -> Vec<usize> {
    let groups_indices = get_groups_indices(course_id_to_sg_index);
    let mut complete_sgs_indices = Vec::new();
    for sg_index in groups_indices {
        // check there are enough courses in this specialization group
        if (course_id_to_sg_index
            .values()
            .filter(|&&group| group == sg_index)
            .count())
            < sgs[sg_index].courses_sum
        {
            // There are not enough courses in this sg to complete the requirement
            continue;
        }
        // check if the user completed the mandatory courses in sg
        if let Some(mandatory) = &sgs[sg_index].mandatory {
            let mut complete_mandatory = true;
            for courses in mandatory {
                let mut completed_current_demand = false;
                for (course_id, group) in course_id_to_sg_index {
                    // check if the user completed one of courses
                    if *group == sg_index && courses.contains(course_id) {
                        completed_current_demand = true;
                        break;
                    }
                }
                if !completed_current_demand {
                    complete_mandatory = false;
                }
            }
            if complete_mandatory {
                complete_sgs_indices.push(sg_index);
            }
        }
    }
    complete_sgs_indices
}

// This function is looking for a valid assignment for the courses which fulfill the sgs requirements
// If an assignment is found it returns it, None otherwise.
fn find_valid_assignment_for_courses(
    sgs: &[SpecializationGroup],
    groups_indices: &[usize],
    optional_sgs_for_course: &HashMap<CourseId, Vec<usize>>, // list of all optional sgs for each course
    current_best_match: &mut HashMap<CourseId, usize>,       // the best match of sgs
    course_id_to_sg_index: &mut HashMap<CourseId, usize>,
    course_index: usize, // course_index-th element in optional_sgs_for_course
) -> Option<HashMap<CourseId, usize>> {
    if course_index >= optional_sgs_for_course.len() {
        let complete_sgs_indices = get_complete_sgs_indices(sgs, course_id_to_sg_index);
        if complete_sgs_indices.len() >= groups_indices.len() {
            return Some(course_id_to_sg_index.clone());
        }
        let complete_sgs_for_current_best_match = get_complete_sgs_indices(sgs, current_best_match);
        if complete_sgs_indices.len() > complete_sgs_for_current_best_match.len() {
            current_best_match.clear();
            current_best_match.extend(course_id_to_sg_index.to_owned());
        }
        return None;
    }
    if let Some((course_id, optional_groups)) = optional_sgs_for_course.iter().nth(course_index) {
        for sg_index in optional_groups {
            course_id_to_sg_index.insert(course_id.clone(), *sg_index);
            if let Some(valid_assignment) = find_valid_assignment_for_courses(
                sgs,
                groups_indices,
                optional_sgs_for_course,
                current_best_match,
                course_id_to_sg_index,
                course_index + 1,
            ) {
                return Some(valid_assignment);
            }
        }
    }
    None
}

fn get_sgs_courses_assignment(
    sgs: &[SpecializationGroup],
    groups_indices: &[usize],
    courses: &[CourseId],
    best_match: &mut HashMap<CourseId, usize>,
) -> Option<HashMap<CourseId, usize>> {
    let mut optional_sgs_for_course = HashMap::<CourseId, Vec<usize>>::new();
    for course_id in courses {
        let mut relevant_groups_for_course: Vec<usize> = Vec::new();
        for sg_index in groups_indices {
            if sgs[*sg_index].course_list.contains(course_id) {
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
        best_match,
        &mut courses_assignment,
        0,
    )
}

// generates all subsets of size specialization_groups.groups_number and checks if one of them is fulfilled
fn generate_sgs_subsets(
    sgs: &[SpecializationGroup],
    required_number_of_groups: usize,
    sg_index: usize,
    groups_indices: &mut Vec<usize>,
    courses: &[CourseId],
    best_match: &mut HashMap<CourseId, usize>,
) -> Option<HashMap<CourseId, usize>> {
    if groups_indices.len() == required_number_of_groups {
        return get_sgs_courses_assignment(sgs, groups_indices, courses, best_match);
    }

    if sg_index >= sgs.len() {
        return None;
    }

    // current group is included
    groups_indices.push(sg_index);
    if let Some(valid_assignment) = generate_sgs_subsets(
        sgs,
        required_number_of_groups,
        sg_index + 1,
        groups_indices,
        courses,
        best_match,
    ) {
        return Some(valid_assignment);
    }

    // current group is excluded
    groups_indices.pop();
    generate_sgs_subsets(
        sgs,
        required_number_of_groups,
        sg_index + 1,
        groups_indices,
        courses,
        best_match,
    )
}

pub fn run_exhaustive_search(
    sgs: &SpecializationGroups,
    courses: Vec<CourseId>, // list of all courses the user completed in specialization groups bank
) -> HashMap<CourseId, usize> {
    let mut best_match = HashMap::new();
    generate_sgs_subsets(
        &sgs.groups_list,
        sgs.groups_number,
        0,
        &mut Vec::new(),
        &courses,
        &mut best_match,
    )
    .unwrap_or(best_match)
}
