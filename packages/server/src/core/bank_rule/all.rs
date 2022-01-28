use crate::{
    core::messages,
    resources::course::{Course, CourseId, CourseState, CourseStatus},
};

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    fn remove_duplicate_unmodified_courses(&mut self) {
        let duplicate_courses = self
            .user
            .degree_status
            .course_statuses
            .iter()
            .filter(|course_status| {
                let mut repetitions = 0;
                if course_status.r#type == Some(self.bank_name.clone()) {
                    for optional_duplicate in self.user.degree_status.course_statuses.iter() {
                        if optional_duplicate.course.id == course_status.course.id {
                            repetitions += 1;
                        }
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
    pub fn all(mut self, missing_credit: &mut f32) -> f32 {
        let credit_info = self.iterate_course_list();

        // handle courses in course list which the user didn't complete or any replacement for them
        for course_id in &self.course_list {
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

        *missing_credit = credit_info.missing_credit;
        credit_info.sum_credit
    }
}
