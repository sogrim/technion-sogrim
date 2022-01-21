use crate::{
    core::messages,
    resources::course::{Course, CourseState, CourseStatus},
};

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
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
        *missing_credit = credit_info.missing_credit;
        credit_info.sum_credit
    }
}
