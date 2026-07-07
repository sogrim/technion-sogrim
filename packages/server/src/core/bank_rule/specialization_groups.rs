use std::collections::{HashMap, HashSet};

use crate::{
    core::types::{SpecializationGroup, SpecializationGroups, SpecializationGroupsType},
    resources::course::CourseId,
};

use super::BankRuleHandler;

// sg = specialization group. A completed group contributes weight 1, or weight 2 when a group that
// carries a `double` spec reaches its double threshold. The bank is fulfilled when the total weight
// of the completed groups reaches `groups_number`.

// A completion candidate: the weight of each group under a given course-to-group assignment, and the
// assignment behind it.
struct Completion {
    levels: Vec<usize>,
    assignment: HashMap<CourseId, usize>,
    weight: usize,
}

fn empty_completion(groups_count: usize) -> Completion {
    Completion {
        levels: vec![0; groups_count],
        assignment: HashMap::new(),
        weight: 0,
    }
}

// Each mandatory sublist must be satisfied by a distinct completed course, so a list repeated k times
// requires k different courses from it.
fn mandatory_satisfied(mandatory: &Option<Vec<Vec<CourseId>>>, courses: &HashSet<CourseId>) -> bool {
    match mandatory {
        None => true,
        Some(sublists) => match_sublists(sublists, courses, 0, &mut HashSet::new()),
    }
}

fn match_sublists(
    sublists: &[Vec<CourseId>],
    courses: &HashSet<CourseId>,
    index: usize,
    used: &mut HashSet<CourseId>,
) -> bool {
    if index == sublists.len() {
        return true;
    }
    for course_id in &sublists[index] {
        if courses.contains(course_id) && used.insert(course_id.clone()) {
            if match_sublists(sublists, courses, index + 1, used) {
                return true;
            }
            used.remove(course_id);
        }
    }
    false
}

// The completion weight of `group` given the courses assigned to it and all completed bank courses.
fn group_weight(
    group: &SpecializationGroup,
    groups_type: &SpecializationGroupsType,
    assigned: &HashSet<CourseId>,
    all_completed: &HashSet<CourseId>,
) -> usize {
    // The mandatory check reads every completed course, except under MandatoryNotShared where a
    // mandatory course must be dedicated to the group.
    let mandatory_pool = match groups_type {
        SpecializationGroupsType::MandatoryNotShared(_) => assigned,
        _ => all_completed,
    };
    if matches!(groups_type, SpecializationGroupsType::Double) {
        if let Some(double) = &group.double {
            if assigned.len() >= double.courses_sum
                && mandatory_satisfied(&double.mandatory, mandatory_pool)
            {
                return 2;
            }
        }
    }
    if assigned.len() >= group.courses_sum && mandatory_satisfied(&group.mandatory, mandatory_pool) {
        return 1;
    }
    0
}

fn evaluate(
    sgs: &SpecializationGroups,
    assignment: &HashMap<CourseId, usize>,
    all_completed: &HashSet<CourseId>,
) -> (Vec<usize>, usize) {
    let mut assigned: Vec<HashSet<CourseId>> = vec![HashSet::new(); sgs.groups_list.len()];
    for (course_id, &group_index) in assignment {
        assigned[group_index].insert(course_id.clone());
    }
    let mut levels = vec![0; sgs.groups_list.len()];
    let mut weight = 0;
    for (index, group) in sgs.groups_list.iter().enumerate() {
        let group_weight = group_weight(group, &sgs.groups_type, &assigned[index], all_completed);
        levels[index] = group_weight;
        weight += group_weight;
    }
    (levels, weight)
}

// Assign each relevant completed course to one of its candidate groups (from the chosen subset) and
// keep the assignment with the greatest total weight.
fn assign_courses(
    sgs: &SpecializationGroups,
    all_completed: &HashSet<CourseId>,
    relevant: &[(CourseId, Vec<usize>)],
    index: usize,
    current: &mut HashMap<CourseId, usize>,
    best: &mut Completion,
) {
    if best.weight >= sgs.groups_number {
        return;
    }
    if index == relevant.len() {
        let (levels, weight) = evaluate(sgs, current, all_completed);
        if weight > best.weight {
            *best = Completion {
                levels,
                assignment: current.clone(),
                weight,
            };
        }
        return;
    }
    let (course_id, candidates) = &relevant[index];
    for &group_index in candidates {
        current.insert(course_id.clone(), group_index);
        assign_courses(sgs, all_completed, relevant, index + 1, current, best);
    }
    current.remove(course_id);
}

// Best assignment restricted to the groups in `subset` (bounds the branching factor).
fn best_for_subset(
    sgs: &SpecializationGroups,
    subset: &[usize],
    completed_courses: &[CourseId],
    all_completed: &HashSet<CourseId>,
) -> Completion {
    let relevant: Vec<(CourseId, Vec<usize>)> = completed_courses
        .iter()
        .filter_map(|course_id| {
            let candidates: Vec<usize> = subset
                .iter()
                .copied()
                .filter(|&group_index| sgs.groups_list[group_index].course_list.contains(course_id))
                .collect();
            (!candidates.is_empty()).then(|| (course_id.clone(), candidates))
        })
        .collect();

    let mut best = empty_completion(sgs.groups_list.len());
    let mut current = HashMap::new();
    assign_courses(sgs, all_completed, &relevant, 0, &mut current, &mut best);
    best
}

// Enumerate subsets of the completable groups (up to `groups_number` groups, since one double covers
// two slots), evaluating each subset's best assignment and keeping the overall best.
fn search_subsets(
    sgs: &SpecializationGroups,
    completable: &[usize],
    completed_courses: &[CourseId],
    all_completed: &HashSet<CourseId>,
    start: usize,
    chosen: &mut Vec<usize>,
    best: &mut Completion,
) {
    if !chosen.is_empty() {
        let completion = best_for_subset(sgs, chosen, completed_courses, all_completed);
        if completion.weight > best.weight {
            *best = completion;
        }
    }
    if best.weight >= sgs.groups_number || chosen.len() == sgs.groups_number {
        return;
    }
    for i in start..completable.len() {
        chosen.push(completable[i]);
        search_subsets(
            sgs,
            completable,
            completed_courses,
            all_completed,
            i + 1,
            chosen,
            best,
        );
        chosen.pop();
        if best.weight >= sgs.groups_number {
            return;
        }
    }
}

fn best_completion(
    sgs: &SpecializationGroups,
    completed_courses: &[CourseId],
    all_completed: &HashSet<CourseId>,
) -> Completion {
    // A group can only contribute if the student completed at least `courses_sum` of its courses.
    let completable: Vec<usize> = (0..sgs.groups_list.len())
        .filter(|&group_index| {
            let group = &sgs.groups_list[group_index];
            completed_courses
                .iter()
                .filter(|course_id| group.course_list.contains(course_id))
                .count()
                >= group.courses_sum
        })
        .collect();

    let mut best = empty_completion(sgs.groups_list.len());
    let mut chosen = Vec::new();
    search_subsets(
        sgs,
        &completable,
        completed_courses,
        all_completed,
        0,
        &mut chosen,
        &mut best,
    );
    best
}

impl BankRuleHandler<'_> {
    // Returns (credit accumulated in the bank, total weight of completed groups).
    pub fn specialization_group(
        mut self,
        sgs: &SpecializationGroups,
        completed_groups: &mut Vec<String>,
    ) -> (f32, usize) {
        // Every course that might belong to a group gets that group's name; the final assignment
        // below re-labels the courses that end up in a completed group.
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
        let all_completed: HashSet<CourseId> = completed_courses.iter().cloned().collect();

        let best = best_completion(sgs, &completed_courses, &all_completed);

        for (course_id, &group_index) in &best.assignment {
            if best.levels[group_index] >= 1 {
                if let Some(course_status) = self.degree_status.get_mut_course_status(course_id) {
                    course_status.set_specialization_group_name(&sgs.groups_list[group_index].name);
                }
            }
        }

        let mut completed_weight = 0;
        for (group_index, &level) in best.levels.iter().enumerate() {
            if level >= 1 {
                completed_weight += level;
                let name = &sgs.groups_list[group_index].name;
                completed_groups.push(if level >= 2 {
                    format!("{name} (כפולה)")
                } else {
                    name.clone()
                });
            }
        }

        (credit_info.sum_credit, completed_weight)
    }
}
