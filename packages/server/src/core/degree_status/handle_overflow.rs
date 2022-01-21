use crate::resources::course::CourseBank;

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
}
