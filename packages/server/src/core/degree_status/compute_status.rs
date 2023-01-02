use crate::core::{messages, types::Transfer};

use super::DegreeStatusHandler;

impl<'a> DegreeStatusHandler<'a> {
    pub fn compute_status(mut self) {
        for bank in self.course_banks.clone() {
            let course_list_for_bank = self.catalog.get_course_list(&bank.name);
            let credit_overflow = self.calculate_overflows(&bank.name, Transfer::CreditOverflow);
            let missing_credit = self.calculate_overflows(&bank.name, Transfer::MissingCredit);
            let courses_overflow =
                self.calculate_overflows(&bank.name, Transfer::CoursesOverflow) as u32;

            if bank.credit.is_none() {
                // Add a message where this bank's credit are counted.
                if let Some(to_bank_name) = self.find_next_bank_with_credit_requirement(&bank.name)
                {
                    self.degree_status
                        .overflow_msgs
                        .push(messages::credit_overflow_detailed_msg(
                            &bank.name,
                            &to_bank_name,
                        ));
                }
            }

            self.compute_bank(
                bank,
                course_list_for_bank,
                credit_overflow,
                missing_credit,
                courses_overflow,
            );
        }

        let credit_leftovers = self.calculate_credit_leftovers(); // if different from 0 then the user has extra credit he doesn't use
        self.degree_status.total_credit += credit_leftovers;
        self.degree_status
            .overflow_msgs
            .push(messages::credit_leftovers_msg(credit_leftovers));
    }
}
