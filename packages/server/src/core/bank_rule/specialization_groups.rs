use std::collections::HashMap;

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

fn find_valid_assignment_for_courses(
    sgs: &Vec<SpecializationGroup>,
    groups_indices: &Vec<u8>,
    optional_sgs_for_course: &HashMap<CourseId, Vec<u8>>, // list of all optional sgs for each course
    course_id_to_sg_index: &mut HashMap<CourseId, u8>,
    course_index: usize, // course_index-th element in optional_sgs_for_course
) -> bool {
    if course_index >= optional_sgs_for_course.len() {
        return check_courses_assignment_for_sgs(sgs, groups_indices, course_id_to_sg_index);
    }
    if let Some((course_id, optional_groups)) = optional_sgs_for_course.iter().nth(course_index) {
        for sg_index in optional_groups {
            course_id_to_sg_index.insert(course_id.clone(), *sg_index);
            if find_valid_assignment_for_courses(
                sgs,
                groups_indices,
                optional_sgs_for_course,
                course_id_to_sg_index,
                course_index + 1,
            ) {
                return true;
            }
        }
    }
    false
}

fn check_if_completed_groups(
    sgs: &Vec<SpecializationGroup>,
    groups_indices: &Vec<u8>,
    courses: &[CourseId],
) {
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
    if find_valid_assignment_for_courses(
        sgs,
        groups_indices,
        &optional_sgs_for_course,
        &mut courses_assignment,
        0,
    ) {
        println!("{:#?}", courses_assignment);
        println!("we did it");
    }
}

// generates all subsets of size specialization_groups.groups_number and checks if one of them is fulfilled
fn generate_subsets(
    sgs: &Vec<SpecializationGroup>,
    required_number_of_groups: u8,
    sg_index: u8,
    groups_indices: &mut Vec<u8>,
    courses: &[CourseId],
) {
    if groups_indices.len() as u8 == required_number_of_groups {
        check_if_completed_groups(sgs, groups_indices, courses);
        return;
    }

    if sg_index >= sgs.len() as u8 {
        return;
    }

    // current group is included
    groups_indices.push(sg_index);
    generate_subsets(
        sgs,
        required_number_of_groups,
        sg_index + 1,
        groups_indices,
        courses,
    );

    // current group is excluded
    groups_indices.pop();
    generate_subsets(
        sgs,
        required_number_of_groups,
        sg_index + 1,
        groups_indices,
        courses,
    );
}

fn exhaustive_search(
    sgs: &Vec<SpecializationGroup>,
    required_number_of_groups: u8,
    courses: &[CourseId],
) {
    generate_subsets(&sgs, required_number_of_groups, 0, &mut Vec::new(), courses);
}

#[test]
fn test_specialization_group() {
    // for debugging
    let specialization_groups = SpecializationGroups {
        groups_list: vec![
            SpecializationGroup {
                // The user completed this group with 114052, 104031
                name: "math".to_string(),
                courses_sum: 2,
                course_list: vec![
                    "114052".to_string(),
                    "104166".to_string(),
                    "1".to_string(),
                    "104031".to_string(),
                ],
                mandatory: Some(vec![vec!["104031".to_string(), "104166".to_string()]]), // need to accomplish one of the courses 104031 or 104166 or 1
            },
            SpecializationGroup {
                // Although the user completed 4 courses from this group and the mandatory courses,
                // he didn't complete this group because 104031 was taken to "math"
                name: "physics".to_string(),
                courses_sum: 4,
                course_list: vec![
                    "104031".to_string(),
                    "114054".to_string(),
                    "236303".to_string(),
                    "236512".to_string(),
                    "104166".to_string(),
                ],
                mandatory: Some(vec![
                    vec!["114054".to_string(), "236303".to_string()],
                    vec!["104166".to_string(), "236512".to_string()],
                ]),
            },
            SpecializationGroup {
                // The user didn't complete the mandatory course
                name: "other".to_string(),
                courses_sum: 1,
                course_list: vec![
                    "104031".to_string(),
                    "114054".to_string(),
                    "236303".to_string(),
                    "236512".to_string(),
                    "104166".to_string(),
                    "394645".to_string(),
                ],
                mandatory: Some(vec![vec!["104166".to_string()]]),
            },
        ],
        groups_number: 2,
    };

    let courses = vec![
        "104031".to_string(),
        "236303".to_string(),
        "114052".to_string(),
        "114054".to_string(),
        "236512".to_string(),
        "104166".to_string(),
    ];
    exhaustive_search(
        &specialization_groups.groups_list,
        specialization_groups.groups_number,
        &courses,
    );
}

impl<'a> BankRuleHandler<'a> {
    pub fn specialization_group(
        mut self,
        specialization_groups: &SpecializationGroups,
        completed_groups: &mut Vec<String>,
    ) -> f32 {
        let credit_info = self.iterate_course_list();

        // for specialization_group in &specialization_groups.groups_list {
        //     //check if the user completed all the specialization groups requirements
        //     let mut completed_group = true;
        //     if let Some(mandatory) = &specialization_group.mandatory {
        //         for courses in mandatory {
        //             let mut completed_current_demand = false;
        //             for course_id in courses {
        //                 // check if the user completed one of courses
        //                 if let Some(course_id) = credit_info.handled_courses.get(course_id) {
        //                     if let Some(course_status) = self.user.get_course_status(course_id) {
        //                         if course_status.passed()
        //                             && course_status.specialization_group_name.is_none()
        //                         {
        //                             completed_current_demand = true;
        //                             break;
        //                         }
        //                     }
        //                 }
        //             }
        //             completed_group &= completed_current_demand;
        //             if !completed_group {
        //                 // The user didn't completed one of the mandatory courses
        //                 break;
        //             }
        //         }
        //     }
        //     if !completed_group {
        //         continue;
        //     }
        //     let mut chosen_courses = Vec::new();
        //     for course_id in &specialization_group.course_list {
        //         if let Some(course_id) = credit_info.handled_courses.get(course_id) {
        //             if let Some(course_status) = self.user.get_course_status(course_id) {
        //                 if course_status.passed()
        //                     && course_status.specialization_group_name.is_none()
        //                 {
        //                     chosen_courses.push(course_id.clone());
        //                 }
        //                 if (chosen_courses.len() as u8) == specialization_group.courses_sum {
        //                     // Until we implement exhaustive search on the specialization groups we should add this condition, so we cover more cases.
        //                     // when we find enough courses to finish this specialization group we don't need to check more courses, and then those courses can be taken to other groups.
        //                     break;
        //                 }
        //             }
        //         }
        //     }
        //     completed_group &= (chosen_courses.len() as u8) == specialization_group.courses_sum;
        //     if completed_group {
        //         completed_groups.push(specialization_group.name.clone());
        //         for course_id in chosen_courses {
        //             let course_status = self.user.get_mut_course_status(&course_id);
        //             if let Some(course_status) = course_status {
        //                 course_status.set_specialization_group_name(&specialization_group.name);
        //             }
        //         }
        //     }
        // }

        credit_info.sum_credit
    }
}
