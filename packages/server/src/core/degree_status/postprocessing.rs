use crate::{
    core::{messages, types::Rule},
    resources::{
        catalog::Catalog,
        course::{CourseId, CourseStatus, Grade},
    },
};

use super::DegreeStatus;

pub const TECHNICAL_ENGLISH_ADVANCED_B: &str = "324033";
pub const MEDICINE_PRECLINICAL_MIN_AVG: f32 = 75.0;
pub const MEDICINE_PRECLINICAL_COURSE_REPETITIONS_LIMIT: usize = 2;
pub const MEDICINE_PRECLINICAL_TOTAL_REPETITIONS_LIMIT: usize = 3;
const EXEMPT_COURSES_COUNT_DEMAND: usize = 2;
const ADVANCED_B_COURSES_COUNT_DEMAND: usize = 1;
const MINIMAL_YEAR_FOR_ENGLISH_REQUIREMENT: usize = 2021;
const SPORT_BANK_NAME: &str = "חינוך גופני";
const MEDICINE_ACCUMULATE_CREDIT_BANK_NAME: &str = "בחירה פקולטית";

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

impl DegreeStatus {
    // This function returns a list of all courses with Some(grade) that belong to bank_name, sorted by grade in descending order.
    fn get_ordered_courses_for_bank_by_grade(&self, bank_name: &str) -> Vec<&CourseStatus> {
        let mut ordered_course_statuses = self
            .course_statuses
            .iter()
            .filter(|course_status| {
                course_status.r#type == Some(bank_name.to_string()) && course_status.grade.is_some()
            })
            .collect::<Vec<_>>();

        ordered_course_statuses.sort_by(|c1, c2| {
            if let (Some(g1), Some(g2)) = (&c1.grade, &c2.grade) {
                g2.partial_cmp(g1).unwrap_or(std::cmp::Ordering::Equal)
            } else {
                std::cmp::Ordering::Equal
            }
        });

        ordered_course_statuses
    }

    // The function returns a list of the highest grade courses that are needed to reach the credit requirement of the bank.
    // for example, if the credit requirement is 10 points and the student has 3 courses that each one is 5 points with grades 90, 80 and 70, the function will return the first 2 courses.
    fn get_highest_grade_courses_up_to_credit_requirement(
        &self,
        catalog: &Catalog,
        bank_name: &str,
    ) -> Vec<&CourseStatus> {
        let credit_requirement = catalog
            .get_course_bank_by_name(bank_name)
            .map(|course_bank| course_bank.credit.unwrap_or_default());
        let Some(mut credit_requirement) = credit_requirement else {
            // shouldn't get here as we send a bank with credit requirement
            return vec![]
        };

        self.get_ordered_courses_for_bank_by_grade(bank_name)
            .into_iter()
            .take_while(|course_status| {
                let Some(Grade::Numeric(_)) = course_status.grade else {
                    // The grade is none or not numeric and because the grades are ordered, it means all grades afterwards are also none or not numeric
                    return false;
                };
                credit_requirement -= course_status.course.credit;
                credit_requirement >= 0.0
            })
            .collect::<Vec<_>>()
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

    fn medicine_preclinical_avg(&self, catalog: &Catalog) -> f32 {
        let rule_all_courses = self.course_statuses.iter().filter(|course_status| {
            get_courses_of_rule_all(catalog).contains(&course_status.course.id)
        });

        let highest_sport_grades =
            self.get_highest_grade_courses_up_to_credit_requirement(catalog, SPORT_BANK_NAME);

        let highest_accumulated_credit_grades = self
            .get_highest_grade_courses_up_to_credit_requirement(
                catalog,
                MEDICINE_ACCUMULATE_CREDIT_BANK_NAME,
            );

        let highest_grade_courses = rule_all_courses
            .chain(highest_sport_grades)
            .chain(highest_accumulated_credit_grades);

        let sum_credit = highest_grade_courses
            .clone()
            .filter_map(|course_status| {
                if let Some(Grade::Numeric(_)) = course_status.grade {
                    Some(course_status.course.credit)
                } else {
                    None
                }
            })
            .sum::<f32>();

        highest_grade_courses
            .filter_map(|course_status| {
                if let Some(Grade::Numeric(numeric_grade)) = course_status.grade {
                    Some(numeric_grade as f32 * course_status.course.credit)
                } else {
                    None
                }
            })
            .sum::<f32>()
            / sum_credit
    }

    fn medicine_preclinical_violate_course_repetitions(
        &self,
        catalog: &Catalog,
    ) -> Option<&CourseStatus> {
        let rule_all_courses = self.course_statuses.iter().filter(|course_status| {
            get_courses_of_rule_all(catalog)
                .contains(&course_status.r#type.clone().unwrap_or_default())
        });

        let mut all_medicine_courses = rule_all_courses.chain(
            self.course_statuses
                .iter()
                .filter(|course_status| course_status.course.is_medicine_preclinical()),
        );

        all_medicine_courses.find(|course_status| {
            course_status.times_repeated >= MEDICINE_PRECLINICAL_COURSE_REPETITIONS_LIMIT
                || (course_status.times_repeated
                    == MEDICINE_PRECLINICAL_COURSE_REPETITIONS_LIMIT - 1
                    && !course_status.not_completed())
        })
    }

    fn medicine_preclinical_total_repetitions(&self, catalog: &Catalog) -> usize {
        let rule_all_courses = self.course_statuses.iter().filter(|course_status| {
            get_courses_of_rule_all(catalog)
                .contains(&course_status.r#type.clone().unwrap_or_default())
        });

        let all_medicine_courses = rule_all_courses.chain(
            self.course_statuses
                .iter()
                .filter(|course_status| course_status.course.is_medicine_preclinical()),
        );

        all_medicine_courses
            .map(|course_status| course_status.times_repeated)
            .sum()
    }

    fn medicine_postprocessing(&mut self, catalog: &Catalog) {
        self.overflow_msgs
            .push(match self.medicine_preclinical_avg(catalog) {
                avg if avg < MEDICINE_PRECLINICAL_MIN_AVG => {
                    messages::medicine_preclinical_avg_error_msg(avg)
                }
                avg => messages::medicine_preclinical_avg_msg(avg),
            });

        if let Some(course_status_exceeded_repetitions_limit) =
            self.medicine_preclinical_violate_course_repetitions(catalog)
        {
            self.overflow_msgs
                .push(messages::medicine_preclinical_course_repetitions_error_msg(
                    course_status_exceeded_repetitions_limit,
                ));
        }

        let repetitions = self.medicine_preclinical_total_repetitions(catalog);
        if repetitions >= MEDICINE_PRECLINICAL_TOTAL_REPETITIONS_LIMIT {
            self.overflow_msgs
                .push(messages::medicine_preclinical_total_repetitions_error_msg(
                    repetitions,
                ));
        }
    }

    pub fn postprocess(&mut self, catalog: &Catalog) {
        self.check_english_requirement(catalog.year());
        if catalog.is_medicine() {
            self.medicine_postprocessing(catalog);
        }
    }
}
