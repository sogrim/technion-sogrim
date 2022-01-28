use crate::{
    core::messages,
    resources::course::{Course, CourseId, CourseState, CourseStatus},
};

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    // returns true if c1 == c2 or c2 is a replacement for c1
    fn is_duplicate(&self, c1: &CourseId, c2: &CourseId) -> bool {
        if c1 == c2 {
            true
        } else if let Some(replacements) = self.catalog_replacements.get(c1) {
            if replacements.contains(c2) {
                true
            } else {
                false
            }
        } else if let Some(replacements) = self.common_replacements.get(c1) {
            if replacements.contains(c2) {
                true
            } else {
                false
            }
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
    pub fn all(mut self, missing_credit: &mut f32, completed: &mut bool) -> f32 {
        let credit_info = self.iterate_course_list();

        self.remove_duplicate_unmodified_courses();

        // handle courses in course list which the user didn't complete or any replacement for them
        // If the user didn't complete one of the courses requirements the bank is not completed
        for course_id in &self.course_list {
            if !credit_info.handled_courses.contains_key(course_id) {
                *completed = false;
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
            } else {
                if !self
                    .user
                    .get_course_status(&credit_info.handled_courses[course_id])
                    .unwrap() // unwrap can't fail, if the course is in "handled_courses" it means the user had a course with this id in his list
                    .passed()
                {
                    *completed = false;
                }
            }
        }

        *missing_credit = credit_info.missing_credit;
        credit_info.sum_credit
    }
}
