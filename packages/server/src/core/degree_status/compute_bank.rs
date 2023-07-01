use std::collections::HashMap;

use crate::core::types::Requirement;
use crate::{
    core::{bank_rule::BankRuleHandler, messages, types::Rule},
    resources::course::CourseBank,
};

use super::DegreeStatusHandler;

impl<'a> DegreeStatusHandler<'a> {
    pub fn compute_bank(
        &mut self,
        bank: CourseBank,
        credit_overflow: f32,
        missing_credit_from_prev_banks: f32,
        courses_overflow: usize,
    ) {
        let mut bank_rule_handler = BankRuleHandler {
            degree_status: self.degree_status,
            bank: &bank,
            replaced_courses: HashMap::new(),
            courses: &self.courses,
            credit_overflow,
            courses_overflow,
        };

        // Initialize necessary variable for rules handling
        let mut missing_credit = 0.0; // for all rule
        let mut completed = true;

        let mut requirement = Requirement {
            course_bank_name: bank.name.clone(),
            bank_rule_name: bank.rule.clone().to_string(),
            ..Default::default()
        };

        match bank.rule {
            Rule::All(ref courses) => {
                let mut sum_credit_requirement = 0.0;
                bank_rule_handler.all(courses, &mut sum_credit_requirement, &mut completed);
                if let Some(credit) = bank.credit {
                    if sum_credit_requirement < credit {
                        missing_credit = credit - sum_credit_requirement;
                        self.missing_credit_map
                            .insert(bank.name.clone(), missing_credit);
                    }
                }
            }
            Rule::AccumulateCredit(_) => bank_rule_handler.accumulate_credit(),
            Rule::AccumulateCourses((num_courses, _)) => {
                let mut count_courses = 0;
                bank_rule_handler.accumulate_courses(&mut count_courses);
                count_courses = if count_courses <= num_courses {
                    count_courses
                } else {
                    self.courses_overflow_map
                        .insert(bank.name.clone(), (count_courses - num_courses) as f32);
                    num_courses
                };
                requirement
                    .course_requirement(num_courses)
                    .course_completed(count_courses);
                completed = count_courses >= num_courses;
            }
            Rule::Malag => bank_rule_handler.malag(),
            Rule::Sport => bank_rule_handler.sport(),
            Rule::Elective => bank_rule_handler.elective(),
            Rule::Chains(ref chains) => {
                let mut chain_done = Vec::new();
                bank_rule_handler.chain(chains, &mut chain_done);
                completed = !chain_done.is_empty();
                if completed {
                    requirement.message(messages::completed_chain_msg(chain_done));
                }
            }
            Rule::SpecializationGroups(ref specialization_groups) => {
                let mut groups_done_list = Vec::new();
                bank_rule_handler
                    .specialization_group(specialization_groups, &mut groups_done_list);
                completed = groups_done_list.len() >= specialization_groups.groups_number;
                if bank.credit.is_none() {
                    requirement
                        .course_requirement(specialization_groups.groups_number)
                        .course_completed(groups_done_list.len());
                }
                requirement.message(messages::completed_specialization_groups_msg(
                    groups_done_list,
                    specialization_groups.groups_number,
                ));
            }
            Rule::Wildcard(_) => {
                todo!()
            }
        }

        bank_rule_handler.add_replacement_messages();

        let mut sum_credit = credit_overflow + self.degree_status.sum_credit_for_bank(&bank.name);

        match bank.credit {
            Some(bank_credit) => {
                let new_bank_credit = bank_credit - missing_credit + missing_credit_from_prev_banks;
                sum_credit = self.handle_credit_overflow(&bank, new_bank_credit, sum_credit);
                completed &= sum_credit >= new_bank_credit;
                requirement.credit_requirement(new_bank_credit);
            }
            None => sum_credit = self.handle_credit_overflow(&bank, 0.0, sum_credit),
        };

        requirement
            .credit_completed(sum_credit)
            .completed(completed);

        self.degree_status
            .course_bank_requirements
            .push(requirement);
    }
}
