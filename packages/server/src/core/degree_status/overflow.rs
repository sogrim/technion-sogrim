use crate::{
    core::{
        messages::{courses_overflow_msg, credit_overflow_msg, missing_credit_msg},
        types::CreditTransfer,
    },
    resources::course::CourseBank,
};

use super::DegreeStatusHandler;

impl<'a> DegreeStatusHandler<'a> {
    pub fn handle_credit_overflow(
        &mut self,
        bank: &CourseBank,
        bank_credit: f32,
        sum_credit: f32,
    ) -> f32 {
        if sum_credit <= bank_credit {
            self.user.degree_status.total_credit += sum_credit;
            sum_credit
        } else {
            match self.credit_overflow_map.get_mut(&bank.name) {
                Some(bank_overflow_item) => *bank_overflow_item += sum_credit - bank_credit,
                None => {
                    let _ = self
                        .credit_overflow_map
                        .insert(bank.name.clone(), sum_credit - bank_credit);
                }
            };
            self.user.degree_status.total_credit += bank_credit;
            bank_credit
        }
    }

    pub fn handle_courses_overflow(
        &mut self,
        bank: &CourseBank,
        num_courses: u32,
        count_courses: u32,
    ) -> u32 {
        if count_courses <= num_courses {
            count_courses
        } else {
            self.courses_overflow_map
                .insert(bank.name.clone(), (count_courses - num_courses) as f32);
            num_courses
        }
    }

    pub fn calculate_overflows(&mut self, bank_name: &str, transfer: CreditTransfer) -> f32 {
        let mut sum = 0.0;
        let map = match transfer {
            CreditTransfer::OverflowCredit => &mut self.credit_overflow_map,
            CreditTransfer::MissingCredit => &mut self.missing_credit_map,
            CreditTransfer::OverflowCourses => &mut self.courses_overflow_map,
        };
        for rule in &self.catalog.credit_overflows {
            if rule.to == bank_name {
                if let Some(overflow) = map.get_mut(&rule.from) {
                    if *overflow > 0.0 {
                        let msg = match transfer {
                            CreditTransfer::OverflowCredit => {
                                if let Some(course_bank) =
                                    self.catalog.get_course_bank_by_name(&rule.from)
                                {
                                    if course_bank.credit.is_some() {
                                        Some(credit_overflow_msg(*overflow, &rule.from, &rule.to))
                                    } else {
                                        None
                                    }
                                } else {
                                    None
                                }
                            }
                            CreditTransfer::OverflowCourses => {
                                Some(courses_overflow_msg(*overflow, &rule.from, &rule.to))
                            }
                            CreditTransfer::MissingCredit => {
                                Some(missing_credit_msg(*overflow, &rule.from, &rule.to))
                            }
                        };
                        if let Some(msg) = msg {
                            self.user.degree_status.overflow_msgs.push(msg);
                        }
                        sum += *overflow;
                        *overflow = 0.0;
                    }
                }
            }
        }
        sum
    }
}
