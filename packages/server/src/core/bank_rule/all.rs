use crate::{
    core::messages,
    resources::course::{Course, CourseId, CourseState, CourseStatus},
};

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
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
