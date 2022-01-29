use crate::{
    core::messages,
    resources::course::{Course, CourseId, CourseState, CourseStatus},
};

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    // returns true if c1 == c2 or c2 is a replacement for c1
    #[allow(clippy::ptr_arg)]
    fn is_duplicate(&self, c1: &CourseId, c2: &CourseId) -> bool {
        if c1 == c2 {
            true
        } else if let Some(replacements) = self.catalog_replacements.get(c1) {
            replacements.contains(c2)
        } else if let Some(replacements) = self.common_replacements.get(c1) {
            replacements.contains(c2)
        } else {
            false
        }
    }
    fn remove_duplicate_unmodified_courses(&mut self) {
        let duplicate_courses = self
            .user
            .degree_status
            .course_statuses
            .iter()
            .filter(|course_status| {
                if course_status.r#type != Some(self.bank_name.clone()) {
                    // courses which are not in the bank "all" shouldn't be removed.
                    return false;
                }
                let mut repetitions = 0;
                for optional_duplicate in self.user.degree_status.course_statuses.iter() {
                    if optional_duplicate.r#type == Some(self.bank_name.clone())
                        && self
                            .is_duplicate(&course_status.course.id, &optional_duplicate.course.id)
                    {
                        repetitions += 1;
                    }
                }
                repetitions > 1
            })
            .map(|course_status| course_status.course.id.clone())
            .collect::<Vec<CourseId>>();
        self.user
            .degree_status
            .course_statuses
            .retain(|course_status| {
                !duplicate_courses.contains(&course_status.course.id) || course_status.modified
            });
    }
    pub fn all(mut self, sum_credit_requirement: &mut f32, completed: &mut bool) -> f32 {
        let credit_info = self.iterate_course_list();

        // handle courses in course list which the user didn't complete or any replacement for them
        // If the user didn't complete one of the courses requirements the bank is not completed
        for course_id in self.course_list.iter() {
            if !credit_info.handled_courses.contains_key(course_id) {
                let course = if let Some(course) = self.courses.get(course_id) {
                    course.clone()
                } else {
                    Course {
                        id: course_id.clone(),
                        credit: 0.0,
                        name: messages::cannot_find_course(),
                    }
                };
                self.user.degree_status.course_statuses.push(CourseStatus {
                    course,
                    state: Some(CourseState::NotComplete),
                    r#type: Some(self.bank_name.clone()),
                    ..Default::default()
                });
            }
        }

        self.remove_duplicate_unmodified_courses();

        for course_status in self.user.degree_status.course_statuses.iter() {
            if course_status.r#type == Some(self.bank_name.clone()) {
                *sum_credit_requirement += course_status.course.credit;
                if !course_status.passed() {
                    *completed = false;
                }
            }
        }

        credit_info.sum_credit
    }
}
