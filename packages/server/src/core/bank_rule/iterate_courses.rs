use std::collections::HashMap;

use crate::core::messages;
use crate::core::types::CreditInfo;
use crate::resources::catalog::OptionalReplacements;
use crate::resources::course::{Course, CourseId, CourseStatus};

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn iterate_course_list(&mut self) -> CreditInfo {
        // return sum_credit, count_courses, missing_points
        let mut sum_credit = self.credit_overflow;
        let mut count_courses = self.courses_overflow;
        let mut handled_courses = HashMap::new(); // mapping between the course in the catalog to the course which was taken by the student (relevant for replacements)
        for course_status in self.degree_status.course_statuses.iter_mut() {
            let mut course_chosen_for_bank = false;
            if course_status.valid_for_bank(&self.bank_name) {
                if self.course_list.contains(&course_status.course.id) {
                    course_chosen_for_bank = true;
                    handled_courses.insert(
                        course_status.course.id.clone(),
                        course_status.course.id.clone(),
                    );
                } else {
                    #[inline(always)]
                    fn check_if_replacement(
                        course_list: &Vec<CourseId>,
                        courses: &HashMap<CourseId, Course>,
                        course_status: &mut CourseStatus,
                        course_id_in_list: &mut Option<String>,
                        replacements: &HashMap<CourseId, OptionalReplacements>,
                        replacements_msg: impl Fn(&Course) -> String,
                    ) {
                        for course_id in course_list {
                            if let Some(replacements) = &replacements.get(course_id) {
                                if replacements.contains(&course_status.course.id) {
                                    let optional_course = courses.get(course_id);
                                    course_status.set_msg(replacements_msg(
                                        optional_course.unwrap_or(&Course {
                                            id: course_id.clone(),
                                            ..Default::default()
                                        }),
                                    ));

                                    *course_id_in_list = Some(course_id.into());
                                    break;
                                }
                            }
                        }
                    }
                    // check if course_status is a replacement for a course in course list
                    let mut course_id_in_list = None;
                    // First try to find catalog replacements
                    check_if_replacement(
                        &self.course_list,
                        self.courses,
                        course_status,
                        &mut course_id_in_list,
                        self.catalog_replacements,
                        messages::catalog_replacements_msg,
                    );

                    if course_id_in_list.is_none() {
                        // Didn't find a catalog replacement so trying to find a common replacement
                        check_if_replacement(
                            &self.course_list,
                            self.courses,
                            course_status,
                            &mut course_id_in_list,
                            self.common_replacements,
                            messages::common_replacements_msg,
                        );
                    }
                    if let Some(course_id) = course_id_in_list {
                        course_chosen_for_bank = true;
                        handled_courses.insert(course_id.clone(), course_status.course.id.clone());
                    } else if course_status.r#type == Some(self.bank_name.clone()) {
                        // The course is not in the list and not a replacement for any other course on the list
                        // but its type is modified and its the current bank name.
                        // Therefore the course should be added anyway.
                        course_chosen_for_bank = true;
                        handled_courses.insert(
                            course_status.course.id.clone(),
                            course_status.course.id.clone(),
                        );
                    }
                }
            }

            if course_chosen_for_bank
                && Self::set_type_and_add_credit(
                    course_status,
                    self.bank_name.clone(),
                    &mut sum_credit,
                )
            {
                count_courses += 1;
            }
        }

        CreditInfo {
            sum_credit,
            count_courses,
            handled_courses,
        }
    }
}
