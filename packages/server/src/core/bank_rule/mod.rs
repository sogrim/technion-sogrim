pub mod specialization_groups;
#[cfg(test)]
pub mod tests;

use std::collections::{HashMap, HashSet};

use crate::resources::course::{Course, CourseBank, CourseId, CourseState, CourseStatus};

use self::specialization_groups::{get_complete_sgs_indices, run_exhaustive_search};

use super::{
    degree_status::DegreeStatus,
    messages,
    types::{Chain, SpecializationGroups},
};

pub struct BankRuleHandler<'a> {
    pub degree_status: &'a mut DegreeStatus,
    pub bank: &'a CourseBank,
    /// Catalog course id -> Student course id
    pub replaced_courses: HashMap<CourseId, CourseId>,
    pub courses: &'a HashMap<CourseId, Course>,
    pub credit_overflow: f32,
    pub courses_overflow: usize,
}

impl<'a> BankRuleHandler<'a> {
    pub fn is_course_irrelevant(&self, course_id: &CourseId) -> bool {
        self.degree_status
            .get_course_status(course_id)
            .is_some_and(|cs| cs.state == Some(CourseState::Irrelevant))
    }
    pub fn is_course_relevant(&self, course_id: &CourseId) -> bool {
        !self.is_course_irrelevant(course_id)
    }
    pub fn course_or_replacement(&self, course_id: &CourseId) -> Option<&CourseStatus> {
        self.degree_status.get_course_status(
            self.replaced_courses
                .get(course_id)
                .or_else(|| {
                    self.replaced_courses
                        .iter()
                        .find_map(|(from, to)| (to == course_id).then_some(from))
                })
                .unwrap_or(course_id),
        )
    }
    pub fn course_or_replacement_mut(&mut self, course_id: &CourseId) -> Option<&mut CourseStatus> {
        self.degree_status.get_course_status_mut(
            self.replaced_courses
                .get(course_id)
                .or_else(|| {
                    self.replaced_courses
                        .iter()
                        .find_map(|(from, to)| (to == course_id).then_some(from))
                })
                .unwrap_or(course_id),
        )
    }
    pub fn add_replacement_messages(&mut self) {
        for (catalog_course_id, student_course_id) in self.replaced_courses.iter() {
            if let Some(student_course_status) =
                self.degree_status.get_course_status_mut(student_course_id)
            {
                let course = self
                    .courses
                    .get(catalog_course_id)
                    .cloned()
                    .unwrap_or(Course {
                        id: catalog_course_id.clone(),
                        ..Default::default()
                    });
                // check whether the replacement is a catalog replacement or a common replacement
                if self
                    .bank
                    .is_catalog_replacement(catalog_course_id, student_course_id)
                {
                    student_course_status.set_msg(messages::catalog_replacements_msg(&course));
                } else {
                    student_course_status.set_msg(messages::common_replacements_msg(&course));
                }
            }
        }
    }
    pub fn iterate_course_list(&mut self) {
        self.degree_status
            .course_statuses
            .iter_mut()
            .filter(|course_status| course_status.valid_for_bank(&self.bank.name))
            .for_each(|course_status| {
                if let Some(course_id) = self.bank.find_course_or_replacement(&course_status.course)
                {
                    if course_id != course_status.course.id {
                        self.replaced_courses
                            .insert(course_id, course_status.course.id.clone());
                    }
                    course_status.set_type(&self.bank.name);
                }
            });
    }
    pub fn elective(&mut self) {
        self.degree_status
            .course_statuses
            .iter_mut()
            .filter(|course_status| course_status.valid_for_bank(&self.bank.name))
            .filter(|course_status| {
                course_status.semester.is_some() || course_status.course.credit != 0.0
            })
            .for_each(|course_status| {
                course_status.set_type(self.bank.name.clone());
            })
    }
    pub fn malag(&mut self) {
        self.iterate_course_list();
    }
    pub fn sport(&mut self) {
        self.iterate_course_list();
    }
    pub fn accumulate_credit(&mut self) {
        self.iterate_course_list();
    }

    pub fn accumulate_courses(&mut self, count_courses: &mut usize) {
        self.iterate_course_list();
        *count_courses =
            self.courses_overflow + self.degree_status.count_courses_for_bank(&self.bank.name);
    }
    // TODO: maybe return the credit and completed as a tuple instead of mutating them
    pub fn all(
        &mut self,
        courses: &[CourseId],
        sum_credit_requirement: &mut f32,
        completed: &mut bool,
    ) {
        self.iterate_course_list();

        // handle courses in course list which the user didn't complete or any replacement for them
        // If the user didn't complete one of the courses requirements the bank is not completed
        let untaken_courses = courses
            .iter()
            .filter(|&course_id| self.course_or_replacement(course_id).is_none())
            .collect::<Vec<_>>();

        untaken_courses.into_iter().for_each(|course_id| {
            let course = self
                .courses
                .get(course_id)
                .cloned()
                .unwrap_or_else(|| Course {
                    id: course_id.clone(),
                    credit: 0.0,
                    name: messages::cannot_find_course(),
                    tags: None,
                });
            self.degree_status.course_statuses.push(CourseStatus {
                course,
                state: Some(CourseState::NotComplete),
                r#type: Some(self.bank.name.clone()),
                ..Default::default()
            });
        });

        self.degree_status
            .course_statuses
            .iter()
            .filter(|course_status| course_status.r#type == Some(self.bank.name.clone()))
            .for_each(|course_status| {
                *sum_credit_requirement += course_status.course.credit;
                *completed &= course_status.completed();
            });
    }
    pub fn chain(&mut self, chains: &[Chain], chain_done: &mut Vec<String>) {
        self.iterate_course_list();
        for chain in chains {
            let chain_complete = chain.iter().all(|course_id| {
                self.course_or_replacement(course_id)
                    .is_some_and(|cs| cs.completed())
            });
            if chain_complete {
                *chain_done = chain
                    .iter()
                    .filter_map(|course_id| self.course_or_replacement(course_id))
                    .map(|course_status| course_status.course.name.clone())
                    .collect();

                break;
            }
        }
    }
    pub fn specialization_group(
        &mut self,
        sgs: &SpecializationGroups,
        completed_groups: &mut Vec<String>,
    ) {
        // All courses which might be in SOME specialization group should get its name assigned to them.
        // Later on, if we find a valid assignment for said courses with a DIFFERENT specialization group,
        // we will simply re-assign the specialization group name.
        for sg in sgs.groups_list.iter() {
            for course_id in sg.course_list.iter() {
                if let Some(course_status) =
                    self.degree_status.get_course_status_mut(course_id.as_str())
                {
                    course_status.set_specialization_group_name(&sg.name);
                }
            }
        }

        self.iterate_course_list();

        let completed_courses = sgs
            .groups_list
            .iter()
            .fold(HashSet::new(), |mut acc, sg| {
                acc.extend(sg.course_list.iter().filter_map(|course_id| {
                    self.course_or_replacement(course_id)
                        .filter(|course_status| course_status.completed())
                        .map(|_| course_id.clone())
                }));
                acc
            })
            .into_iter()
            .collect::<Vec<_>>();

        let valid_assignment_for_courses = run_exhaustive_search(sgs, completed_courses);
        let complete_sgs_indices =
            get_complete_sgs_indices(&sgs.groups_list, &valid_assignment_for_courses);
        // The set is to prevent duplications
        let mut sgs_names = HashSet::new();
        valid_assignment_for_courses
            .into_iter()
            .for_each(|(course_id, sg_index)| {
                if let Some(course_status) = self.course_or_replacement_mut(&course_id) {
                    if complete_sgs_indices.contains(&sg_index) {
                        course_status
                            .set_specialization_group_name(&sgs.groups_list[sg_index].name);
                        sgs_names.insert(&sgs.groups_list[sg_index].name);
                    }
                }
            });

        sgs_names.into_iter().for_each(|sg_name| {
            completed_groups.push(sg_name.clone());
        });
    }
}
