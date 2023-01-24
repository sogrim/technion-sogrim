use crate::{
    core::messages,
    resources::course::{Grade, Tag},
};

use super::DegreeStatus;

const TECHNICAL_ENGLISH_ADVANCED_B: &str = "324033";
const EXEMPT_COURSES_COUNT_DEMAND: usize = 2;
const ADVANCED_B_COURSES_COUNT_DEMAND: usize = 1;

impl DegreeStatus {
    fn check_english_requirement(&mut self) {
        let completed_english_content_courses_count = self
            .course_statuses
            .iter()
            .filter(|course_status| {
                course_status
                    .course
                    .tags
                    .clone()
                    .unwrap_or_default()
                    .contains(&Tag::English)
                    && course_status.completed()
            })
            .count();

        let technical_english_advanced_b_course_status =
            self.get_course_status(TECHNICAL_ENGLISH_ADVANCED_B);

        let Some(technical_english_advanced_b_course_status) = technical_english_advanced_b_course_status else {
            // The student didn't complete technical english advanced b course so it will be marked as not complete in "hova" demand
            // Thus, it is not necessary to add it to the important messages.
            return;
        };
        if !technical_english_advanced_b_course_status.completed() {
            // Same reason as above
            return;
        }
        let Some(technical_english_grade) = technical_english_advanced_b_course_status.grade.clone() else {
            // Same reason as above
            return;
        };

        // Determine by the technical english advanced b course grade kind the english level of the student
        match technical_english_grade {
            Grade::ExemptionWithoutCredit => {
                if completed_english_content_courses_count < EXEMPT_COURSES_COUNT_DEMAND {
                    self.overflow_msgs
                        .push(messages::english_requirement_for_exempt_students_msg());
                }
            }
            Grade::ExemptionWithCredit => {
                if completed_english_content_courses_count < EXEMPT_COURSES_COUNT_DEMAND {
                    self.overflow_msgs
                        .push(messages::english_requirement_for_exempt_students_msg());
                }
            }
            _ => {
                if completed_english_content_courses_count < ADVANCED_B_COURSES_COUNT_DEMAND {
                    self.overflow_msgs.push(
                        messages::english_requirement_for_technical_advanced_b_students_msg(),
                    );
                }
            }
        }
    }
    pub fn postprocess(&mut self) {
        self.check_english_requirement();
    }
}
