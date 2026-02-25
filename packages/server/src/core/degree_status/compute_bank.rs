use crate::core::types::Requirement;
use crate::{
    core::{bank_rule::BankRuleHandler, messages, types::Rule},
    resources::course::{CourseBank, CourseId},
};

use super::DegreeStatusHandler;

impl<'a> DegreeStatusHandler<'a> {
    pub fn compute_bank(
        &mut self,
        bank: CourseBank,
        course_list_for_bank: Vec<CourseId>,
        credit_overflow: f32,
        missing_credit_from_prev_banks: f32,
        courses_overflow: usize,
    ) {
        let bank_rule_handler = BankRuleHandler {
            degree_status: self.degree_status,
            bank_name: bank.name.clone(),
            course_list: course_list_for_bank,
            courses: &self.courses,
            credit_overflow,
            courses_overflow,
            catalog_replacements: &self.catalog.catalog_replacements,
            common_replacements: &self.catalog.common_replacements,
        };

        // Initialize necessary variable for rules handling
        let mut sum_credit;
        let mut missing_credit = 0.0; // for all rule
        let mut completed = true;

        let mut requirement = Requirement {
            course_bank_name: bank.name.clone(),
            bank_rule_name: bank.rule.clone().to_string(),
            ..Default::default()
        };

        match bank.rule {
            Rule::All => {
                let mut sum_credit_requirement = 0.0;
                sum_credit = bank_rule_handler.all(&mut sum_credit_requirement, &mut completed);
                if let Some(credit) = bank.credit {
                    if sum_credit_requirement < credit {
                        missing_credit = credit - sum_credit_requirement;
                    }
                }
                if missing_credit > 0.0 {
                    self.missing_credit_map
                        .insert(bank.name.clone(), missing_credit);
                }
            }
            Rule::AccumulateCredit => sum_credit = bank_rule_handler.accumulate_credit(),
            Rule::AccumulateCourses(num_courses) => {
                let mut count_courses = 0;
                sum_credit = bank_rule_handler.accumulate_courses(&mut count_courses);
                count_courses = self.handle_courses_overflow(&bank, num_courses, count_courses);
                requirement
                    .course_requirement(num_courses)
                    .course_completed(count_courses);
                completed = count_courses >= num_courses;
            }
            Rule::Malag => sum_credit = bank_rule_handler.malag(),
            Rule::Sport => sum_credit = bank_rule_handler.sport(),
            Rule::Elective => sum_credit = bank_rule_handler.elective(),
            Rule::Chains(ref chains) => {
                let mut chain_done = Vec::new();
                sum_credit = bank_rule_handler.chain(chains, &mut chain_done);
                completed = !chain_done.is_empty();
                if completed {
                    requirement.message(messages::completed_chain_msg(chain_done));
                }
            }
            Rule::SpecializationGroups(ref specialization_groups) => {
                let mut groups_done_list = Vec::new();
                sum_credit = bank_rule_handler
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
                sum_credit = 0.0; // TODO: change this
            }
        }

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

#[cfg(test)]
#[path = "compute_bank_tests.rs"]
mod compute_bank_tests;
