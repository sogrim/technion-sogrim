use std::collections::{HashMap, HashSet};

use crate::{
    core::types::{SpecializationGroup, SpecializationGroups},
    resources::course::CourseId,
};

use super::BankRuleHandler;

// General comment for the whole file
// sg = specialization_group
// sgs = specialization_groups

fn is_valid_assignment(
    sgs: &[SpecializationGroup],
    groups_indices: &[usize],
    course_id_to_sg_index: &HashMap<CourseId, usize>,
) -> bool {
    for sg_index in groups_indices {
        // check there are enough courses in this specialization group
        if (course_id_to_sg_index
            .values()
            .filter(|group| *group == sg_index)
            .count())
            < sgs[*sg_index].courses_sum
        {
            // There are not enough courses in this assignment to complete sg requirement
            return false;
        }
        // check if the user completed the mandatory courses in sg
        if let Some(mandatory) = &sgs[*sg_index].mandatory {
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

fn get_best_match(
    course_id_to_sg_index: &HashMap<CourseId, usize>,
    number_of_required_groups: usize,
) -> HashMap<CourseId, usize> {
    let mut maybe_best_match = course_id_to_sg_index.to_owned();
    maybe_best_match.retain(|_, sg_index| {
        // Retain only the sgs indices which appear at least X times (most of the times, X == 3)
        course_id_to_sg_index
            .values()
            .filter(|group| *group == sg_index)
            .count()
            >= number_of_required_groups
    });
    maybe_best_match
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
        if is_valid_assignment(sgs, groups_indices, course_id_to_sg_index) {
            return Some(course_id_to_sg_index.clone());
        }
        let maybe_best_match = get_best_match(course_id_to_sg_index, groups_indices.len());
        if maybe_best_match.len() > current_best_match.len() {
            current_best_match.clear();
            current_best_match.extend(maybe_best_match);
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
                if valid_assignment.len() > current_best_match.len() {
                    //current_best_match.clear();
                    current_best_match.extend(valid_assignment.clone());
                }
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
        let mut relevant_groups_for_course = Vec::new();
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

fn run_exhaustive_search(
    sgs: &SpecializationGroups,
    courses: Vec<CourseId>, // list of all courses the user completed in specialization groups bank
) -> Option<HashMap<CourseId, usize>> {
    let mut best_match = HashMap::new();
    generate_sgs_subsets(
        &sgs.groups_list,
        sgs.groups_number,
        0,
        &mut Vec::new(),
        &courses,
        &mut best_match,
    )
    .or(Some(best_match))
}

impl<'a> BankRuleHandler<'a> {
    pub fn specialization_group(
        mut self,
        sgs: &SpecializationGroups,
        completed_groups: &mut Vec<String>,
    ) -> f32 {
        // All courses which might be in SOME specialization group should get its name assigned to them
        // later on, if we find a valid assignment for said courses with a DIFFERENT specialization group,
        // we will simply re-assign the specialization group name.
        for sg in sgs.groups_list.iter() {
            for course_id in sg.course_list.iter() {
                if let Some(course_status) =
                    self.degree_status.get_mut_course_status(course_id.as_str())
                {
                    course_status.set_specialization_group_name(&sg.name);
                }
            }
        }

        let credit_info = self.iterate_course_list();
        let mut completed_courses = Vec::new();
        for (course_id_in_list, course_id_done_by_user) in credit_info.handled_courses {
            if let Some(course_status) = self
                .degree_status
                .get_course_status(&course_id_done_by_user)
            {
                if course_status.passed() {
                    completed_courses.push(course_id_in_list);
                }
            }
        }

        let valid_assignment_for_courses = run_exhaustive_search(sgs, completed_courses);

        // The set is to prevent duplications
        let mut sgs_names = HashSet::new();
        if let Some(valid_assignment) = valid_assignment_for_courses {
            for (course_id, sg_index) in valid_assignment {
                if let Some(course_status) = self.degree_status.get_mut_course_status(&course_id) {
                    course_status.set_specialization_group_name(&sgs.groups_list[sg_index].name);
                    sgs_names.insert(&sgs.groups_list[sg_index].name);
                }
            }
        }
        for sg_name in sgs_names {
            completed_groups.push(sg_name.clone());
        }

        credit_info.sum_credit
    }
}
