use crate::{
    core::messages,
    resources::course::{Course, CourseState, CourseStatus},
};

use super::BankRuleHandler;

impl<'a> BankRuleHandler<'a> {
    pub fn all(mut self, sum_credit_requirement: &mut f32, completed: &mut bool) -> f32 {
        let credit_info = self.iterate_course_list();

        // handle courses in course list which the user didn't complete or any replacement for them
        // If the user didn't complete one of the courses requirements the bank is not completed
        self.course_list
            .iter()
            .filter(|&course_id| !credit_info.handled_courses.contains_key(course_id))
            .for_each(|course_id| {
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
                    r#type: Some(self.bank_name.clone()),
                    ..Default::default()
                });
            });

        for course_status in self.degree_status.course_statuses.iter() {
            if course_status.r#type == Some(self.bank_name.clone()) {
                *sum_credit_requirement += course_status.course.credit;
                if !course_status.completed() {
                    *completed = false;
                }
            }
        }

        credit_info.sum_credit
    }
}
