use std::collections::{HashMap, HashSet};

use crate::{
    core::types::{SpecializationGroup, SpecializationGroups},
    resources::course::CourseId,
};

use super::BankRuleHandler;

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

/// Check which groups are complete and return (index, weight) pairs.
/// Weight is 2 if the group qualifies as double, 1 otherwise.
fn get_complete_sgs_with_weights(
    sgs: &[SpecializationGroup],
    course_id_to_sg_index: &HashMap<CourseId, usize>,
) -> Vec<(usize, usize)> {
    let groups_indices = get_groups_indices(course_id_to_sg_index);
    let mut result = Vec::new();

    for sg_index in groups_indices {
        let course_count = course_id_to_sg_index
            .values()
            .filter(|&&group| group == sg_index)
            .count();

        let sg = &sgs[sg_index];

        // Check if mandatory requirements are satisfied for a given mandatory spec
        let check_mandatory =
            |mandatory: &Option<Vec<Vec<CourseId>>>| -> bool {
                match mandatory {
                    None => true,
                    Some(reqs) => reqs.iter().all(|courses| {
                        course_id_to_sg_index
                            .iter()
                            .any(|(cid, &grp)| grp == sg_index && courses.contains(cid))
                    }),
                }
            };

        // Try double first (if available and enough courses)
        if let Some(double) = &sg.double {
            if course_count >= double.courses_sum && check_mandatory(&double.mandatory) {
                result.push((sg_index, 2));
                continue;
            }
        }

        // Try single
        if course_count >= sg.courses_sum && check_mandatory(&sg.mandatory) {
            result.push((sg_index, 1));
        }
    }
    result
}

/// Sum the total weight from completed groups.
fn total_weight(completed: &[(usize, usize)]) -> usize {
    completed.iter().map(|(_, w)| w).sum()
}

// This function is looking for a valid assignment for the courses which fulfill the sgs requirements
// If an assignment is found it returns it, None otherwise.
fn find_valid_assignment_for_courses(
    sgs: &[SpecializationGroup],
    target_weight: usize,
    optional_sgs_for_course: &HashMap<CourseId, Vec<usize>>, // list of all optional sgs for each course
    current_best_match: &mut HashMap<CourseId, usize>,       // the best match of sgs
    course_id_to_sg_index: &mut HashMap<CourseId, usize>,
    course_index: usize, // course_index-th element in optional_sgs_for_course
) -> Option<HashMap<CourseId, usize>> {
    if course_index >= optional_sgs_for_course.len() {
        let completed = get_complete_sgs_with_weights(sgs, course_id_to_sg_index);
        if total_weight(&completed) >= target_weight {
            return Some(course_id_to_sg_index.clone());
        }
        let best_completed = get_complete_sgs_with_weights(sgs, current_best_match);
        if total_weight(&completed) > total_weight(&best_completed) {
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
                target_weight,
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
    target_weight: usize,
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
        target_weight,
        &optional_sgs_for_course,
        best_match,
        &mut courses_assignment,
        0,
    )
}

/// Generate all subsets of exactly `size` groups from `sgs` and try each.
fn generate_subsets_of_size(
    sgs: &[SpecializationGroup],
    target_weight: usize,
    size: usize,
    sg_index: usize,
    groups_indices: &mut Vec<usize>,
    courses: &[CourseId],
    best_match: &mut HashMap<CourseId, usize>,
) -> Option<HashMap<CourseId, usize>> {
    if groups_indices.len() == size {
        let max_weight: usize = groups_indices
            .iter()
            .map(|&i| if sgs[i].double.is_some() { 2 } else { 1 })
            .sum();
        if max_weight >= target_weight {
            return get_sgs_courses_assignment(sgs, groups_indices, target_weight, courses, best_match);
        }
        return None;
    }

    if sg_index >= sgs.len() {
        return None;
    }

    // Remaining slots to fill
    let remaining = size - groups_indices.len();
    // Remaining groups available
    let available = sgs.len() - sg_index;
    if available < remaining {
        return None; // Not enough groups left
    }

    // Include current group
    groups_indices.push(sg_index);
    if let Some(assignment) = generate_subsets_of_size(
        sgs, target_weight, size, sg_index + 1, groups_indices, courses, best_match,
    ) {
        return Some(assignment);
    }
    groups_indices.pop();

    // Exclude current group
    generate_subsets_of_size(
        sgs, target_weight, size, sg_index + 1, groups_indices, courses, best_match,
    )
}

fn run_exhaustive_search(
    sgs: &SpecializationGroups,
    courses: Vec<CourseId>,
) -> HashMap<CourseId, usize> {
    let mut best_match = HashMap::new();
    let target = sgs.groups_number;

    // Try smallest subsets first: a 2-group subset with a double (weight 3)
    // should be found before a 3-group subset with all singles (weight 3).
    // Minimum subset size: ceil(target / 2) since max weight per group is 2.
    let min_size = (target + 1) / 2;

    for size in min_size..=sgs.groups_list.len().min(target) {
        if let Some(assignment) = generate_subsets_of_size(
            &sgs.groups_list,
            target,
            size,
            0,
            &mut Vec::new(),
            &courses,
            &mut best_match,
        ) {
            return assignment;
        }
    }
    best_match
}

impl BankRuleHandler<'_> {
    pub fn specialization_group(
        mut self,
        sgs: &SpecializationGroups,
        completed_groups: &mut Vec<(String, usize)>,
    ) -> f32 {
        // All courses which might be in SOME specialization group should get its name assigned to them
        // later on, if we find a valid assignment for said courses with a DIFFERENT specialization group,
        // we will simply re-assign the specialization group name.
        for sg in sgs.groups_list.iter() {
            for course_id in sg.course_list.iter() {
                if let Some(course_status) = self.degree_status.get_mut_course_status(course_id) {
                    course_status.set_specialization_group_name(&sg.name);
                }
            }
        }

        let credit_info = self.iterate_course_list();
        let completed_courses = self
            .degree_status
            .get_all_completed_courses_for_bank(&self.bank_name);

        let valid_assignment_for_courses = run_exhaustive_search(sgs, completed_courses);

        let complete_sgs_with_weights =
            get_complete_sgs_with_weights(&sgs.groups_list, &valid_assignment_for_courses);
        let complete_indices: HashSet<usize> =
            complete_sgs_with_weights.iter().map(|(i, _)| *i).collect();

        // Build a map from index → weight for message generation
        let weight_map: HashMap<usize, usize> = complete_sgs_with_weights.iter().copied().collect();

        // The set is to prevent duplications
        let mut sgs_names = HashSet::new();
        valid_assignment_for_courses
            .into_iter()
            .for_each(|(course_id, sg_index)| {
                if let Some(course_status) = self.degree_status.get_mut_course_status(&course_id) {
                    if complete_indices.contains(&sg_index) {
                        course_status
                            .set_specialization_group_name(&sgs.groups_list[sg_index].name);
                        sgs_names.insert(sg_index);
                    }
                }
            });

        for sg_index in sgs_names {
            let name = sgs.groups_list[sg_index].name.clone();
            let weight = weight_map.get(&sg_index).copied().unwrap_or(1);
            completed_groups.push((name, weight));
        }

        credit_info.sum_credit
    }
}
