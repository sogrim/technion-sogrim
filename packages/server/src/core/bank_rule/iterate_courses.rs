use std::collections::HashMap;

use crate::core::messages;
use crate::core::types::CreditInfo;
use crate::resources::course::Course;

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn iterate_course_list(&mut self) -> CreditInfo {
        // return sum_credit, count_courses, missing_points
        let mut sum_credit = self.credit_overflow;
        let mut count_courses = self.courses_overflow;
        let mut handled_courses = HashMap::new(); // mapping between the course in the catalog to the course which was taken by the student (relevant for replacements)
        self.degree_status
            .course_statuses
            .iter_mut()
            .filter(|course_status| course_status.valid_for_bank(&self.bank_name))
            .filter_map(|course_status| {
                if self.course_list.contains(&course_status.course.id) {
                    Some((course_status.course.id.clone(), course_status))
                } else {
                    let mut find_replacement = |replacements: &HashMap<String, Vec<String>>,
                                                replacements_msg: fn(&Course) -> String|
                     -> Option<String> {
                        self.course_list.iter().find_map(|course_id| {
                            replacements
                                .get(course_id)
                                .and_then(|replacements| {
                                    replacements.contains(&course_status.course.id).then(|| {
                                        course_status.set_msg(replacements_msg(
                                            self.courses.get(course_id).unwrap_or(&Course {
                                                id: course_id.clone(),
                                                ..Default::default()
                                            }),
                                        ));
                                        Some(course_id.into())
                                    })
                                })
                                .flatten()
                        })
                    };
                    // check if course_status is a common replacement or a catalog replacement for a course in course list
                    let course_id_in_list = find_replacement(
                        self.catalog_replacements,
                        messages::catalog_replacements_msg,
                    )
                    .or_else(|| {
                        find_replacement(
                            self.common_replacements,
                            messages::common_replacements_msg,
                        )
                    });

                    if let Some(course_id) = course_id_in_list {
                        Some((course_id, course_status))
                    } else if course_status.r#type == Some(self.bank_name.clone()) {
                        // The course is not in the list and not a replacement for any other course on the list
                        // but its type is modified and its the current bank name.
                        // Therefore the course should be added anyway.
                        Some((course_status.course.id.clone(), course_status))
                    } else {
                        None
                    }
                }
            })
            .for_each(|(course_id, course_status)| {
                handled_courses.insert(course_id, course_status.course.id.clone());
                course_status.set_type(&self.bank_name);
                if let Some(credit) = course_status.credit() {
                    sum_credit += credit;
                    count_courses += 1;
                }
            });

        CreditInfo {
            sum_credit,
            count_courses,
            handled_courses,
        }
    }
}
