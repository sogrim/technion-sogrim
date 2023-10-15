use crate::{
    core::{
        messages::{courses_overflow_msg, credit_overflow_msg, missing_credit_msg},
        types::Transfer,
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
            self.degree_status.total_credit += sum_credit;
            sum_credit
        } else {
            self.credit_overflow_map
                .entry(bank.name.clone())
                .and_modify(|bank_overflow_item| *bank_overflow_item += sum_credit - bank_credit)
                .or_insert(sum_credit - bank_credit);

            self.degree_status.total_credit += bank_credit;
            bank_credit
        }
    }

    pub fn handle_courses_overflow(
        &mut self,
        bank: &CourseBank,
        num_courses: usize,
        count_courses: usize,
    ) -> usize {
        if count_courses <= num_courses {
            count_courses
        } else {
            self.courses_overflow_map
                .insert(bank.name.clone(), (count_courses - num_courses) as f32);
            num_courses
        }
    }

    pub fn calculate_overflows(&mut self, bank_name: &str, transfer: Transfer) -> f32 {
        let mut sum = 0.0;
        let map = match transfer {
            Transfer::CreditOverflow => &mut self.credit_overflow_map,
            Transfer::MissingCredit => &mut self.missing_credit_map,
            Transfer::CoursesOverflow => &mut self.courses_overflow_map,
        };
        for rule in &self.catalog.credit_overflows {
            if rule.to != bank_name {
                continue;
            }
            let Some(overflow) = map.get_mut(&rule.from) else {
                continue;
            };
            if *overflow <= 0.0 {
                continue;
            }
            let msg = match transfer {
                Transfer::CreditOverflow => self
                    .catalog
                    .get_course_bank_by_name(&rule.from)
                    .and_then(|course_bank| {
                        course_bank
                            .credit
                            .map(|_| credit_overflow_msg(*overflow, &rule.from, &rule.to))
                    }),
                Transfer::CoursesOverflow => {
                    Some(courses_overflow_msg(*overflow, &rule.from, &rule.to))
                }
                Transfer::MissingCredit => {
                    Some(missing_credit_msg(*overflow, &rule.from, &rule.to))
                }
            };
            if let Some(msg) = msg {
                self.degree_status.overflow_msgs.push(msg);
            }
            sum += *overflow;
            *overflow = 0.0;
        }
        sum
    }
}
