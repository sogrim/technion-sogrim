use crate::{
    core::{messages, types::Rule},
    resources::{
        catalog::Catalog,
        course::{CourseId, CourseStatus, Grade},
    },
};

use super::DegreeStatus;

pub const TECHNICAL_ENGLISH_ADVANCED_B: &str = "324033";
pub const MEDICINE_PRECLINICAL_MIN_AVG: f64 = 75.0;
pub const MEDICINE_PRECLINICAL_COURSE_REPETITIONS_LIMIT: usize = 2;
pub const MEDICINE_PRECLINICAL_TOTAL_REPETITIONS_LIMIT: usize = 3;
const EXEMPT_COURSES_COUNT_DEMAND: usize = 2;
const ADVANCED_B_COURSES_COUNT_DEMAND: usize = 1;
const MINIMAL_YEAR_FOR_ENGLISH_REQUIREMENT: usize = 2021;

impl DegreeStatus {
    fn get_courses_of_rule_all(catalog: &Catalog) -> Vec<CourseId> {
        catalog
            .course_to_bank
            .iter()
            .filter(|&(_, bank_name)| {
                catalog
                    .course_banks
                    .iter()
                    .filter(|course_bank| matches!(course_bank.rule, Rule::All))
                    .any(|course_bank| course_bank.name == *bank_name)
            })
            .map(|(course, _)| course.clone())
            .collect()
    }

    fn check_english_requirement(&mut self, year: usize) {
        // English requirement is not relevant for students that started their studies before 2021
        if year < MINIMAL_YEAR_FOR_ENGLISH_REQUIREMENT {
            return;
        }

        let completed_english_content_courses_count = self
            .course_statuses
            .iter()
            .filter(|course_status| course_status.course.is_english() && course_status.completed())
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

        // Determine by the technical english advanced b course grade kind the english level of the student
        match technical_english_advanced_b_course_status.grade {
            Some(Grade::ExemptionWithoutCredit | Grade::ExemptionWithCredit)
                if completed_english_content_courses_count < EXEMPT_COURSES_COUNT_DEMAND =>
            {
                self.overflow_msgs
                    .push(messages::english_requirement_for_exempt_students_msg());
            }
            Some(_)
                if completed_english_content_courses_count < ADVANCED_B_COURSES_COUNT_DEMAND =>
            {
                self.overflow_msgs
                    .push(messages::english_requirement_for_technical_advanced_b_students_msg());
            }
            _ => {}
        }
    }

    fn medicine_preclinical_avg(&self) -> f64 {
        let grades = self
            .course_statuses
            .iter()
            .filter(|course_status| course_status.course.is_medicine_preclinical())
            .filter_map(|course_status| {
                if let Some(Grade::Numeric(grade)) = course_status.grade {
                    Some(grade)
                } else {
                    None
                }
            });
        let avg = grades.clone().sum::<u32>() as f64 / grades.count() as f64;
        if avg.is_nan() {
            0.0
        } else {
            avg
        }
    }

    fn medicine_preclinical_course_repetitions(&self, catalog: &Catalog) -> Option<&CourseStatus> {
        self.course_statuses
            .iter()
            .filter(|course_status| {
                course_status.course.is_medicine_preclinical()
                    && Self::get_courses_of_rule_all(catalog).contains(&course_status.course.id)
            })
            .find(|course_status| {
                course_status.times_repeated >= MEDICINE_PRECLINICAL_COURSE_REPETITIONS_LIMIT
            })
    }

    fn medicine_preclinical_total_repetitions(&self, catalog: &Catalog) -> usize {
        self.course_statuses
            .iter()
            .filter(|course_status| {
                course_status.course.is_medicine_preclinical()
                    && Self::get_courses_of_rule_all(catalog).contains(&course_status.course.id)
            })
            .map(|course_status| course_status.times_repeated)
            .sum()
    }

    pub fn postprocess(&mut self, catalog: &Catalog) {
        self.check_english_requirement(catalog.year());
        if catalog.is_medicine() {
            self.overflow_msgs
                .push(match self.medicine_preclinical_avg() {
                    avg if avg < MEDICINE_PRECLINICAL_MIN_AVG => {
                        messages::medicine_preclinical_avg_error_msg(avg)
                    }
                    avg => messages::medicine_preclinical_avg_msg(avg),
                });

            if let Some(course_status_exceeded_repetitions_limit) =
                self.medicine_preclinical_course_repetitions(catalog)
            {
                self.overflow_msgs.push(
                    messages::medicine_preclinical_course_repetitions_error_msg(
                        course_status_exceeded_repetitions_limit,
                    ),
                );
            }

            let repetitions = self.medicine_preclinical_total_repetitions(catalog);
            if repetitions >= MEDICINE_PRECLINICAL_TOTAL_REPETITIONS_LIMIT {
                self.overflow_msgs.push(
                    messages::medicine_preclinical_total_repetitions_error_msg(repetitions),
                );
            }
        }
    }
}
