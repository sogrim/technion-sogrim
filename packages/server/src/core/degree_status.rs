use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::{
    bank_rule::BankRuleHandler,
    messages, toposort,
    types::{CreditTransfer, Requirement, Rule},
};
use crate::resources::{
    catalog::Catalog,
    course::{Course, CourseBank, CourseId, CourseState, CourseStatus},
    user::UserDetails,
};

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct DegreeStatus {
    pub course_statuses: Vec<CourseStatus>,
    pub course_bank_requirements: Vec<Requirement>,
    pub overflow_msgs: Vec<String>,
    pub total_credit: f32,
}

pub fn reset_type_for_unmodified_and_irrelevant_courses(user_details: &mut UserDetails) {
    for course_status in &mut user_details.degree_status.course_statuses {
        if !course_status.modified {
            course_status.r#type = None;
        } else if let Some(state) = &course_status.state {
            if *state == CourseState::Irrelevant {
                course_status.r#type = None;
            }
        }
    }
}

pub fn remove_irrelevant_courses_from_bank_requirements(
    user_details: &UserDetails,
    catalog: &mut Catalog,
) {
    for course_status in &user_details.degree_status.course_statuses {
        if let Some(state) = &course_status.state {
            if *state == CourseState::Irrelevant {
                catalog.course_to_bank.remove(&course_status.course.id);
            }
        }
    }
}
pub struct DegreeStatusHandler<'a> {
    pub user: &'a mut UserDetails,
    pub course_banks: Vec<CourseBank>,
    pub catalog: Catalog,
    pub courses: HashMap<CourseId, Course>,
    pub malag_courses: Vec<CourseId>,
    pub credit_overflow_map: HashMap<String, f32>,
    pub missing_credit_map: HashMap<String, f32>,
    pub courses_overflow_map: HashMap<String, f32>,
}

impl<'a> DegreeStatusHandler<'a> {
    fn find_next_bank(&self, bank_name: &str) -> Option<&CourseBank> {
        for overflow_rule in &self.catalog.credit_overflows {
            if overflow_rule.from == bank_name {
                return self.catalog.get_course_bank_by_name(&overflow_rule.to);
            }
        }
        None
    }
    fn find_next_bank_with_credit_requirement(&self, bank_name: &str) -> Option<String> {
        let mut current_bank = bank_name.to_string();
        while let Some(course_bank) = self.find_next_bank(&current_bank) {
            if course_bank.credit.is_none() {
                current_bank = course_bank.name.clone();
            } else {
                return Some(course_bank.name.clone());
            }
        }
        None
    }

    pub fn get_modified_courses(&self, bank_name: &str) -> Vec<CourseId> {
        let mut modified_courses = Vec::new();
        for course_status in &self.user.degree_status.course_statuses {
            if course_status.modified && course_status.r#type == Some(bank_name.to_string()) {
                modified_courses.push(course_status.course.id.clone());
            }
        }
        modified_courses
    }

    fn calculate_overflows(&mut self, bank_name: &str, transfer: CreditTransfer) -> f32 {
        let mut sum = 0.0;
        let map = match transfer {
            CreditTransfer::OverflowCredit => &mut self.credit_overflow_map,
            CreditTransfer::MissingCredit => &mut self.missing_credit_map,
            CreditTransfer::OverflowCourses => &mut self.courses_overflow_map,
        };
        for overflow_rule in &self.catalog.credit_overflows {
            if overflow_rule.to == bank_name {
                if let Some(overflow) = map.get_mut(&overflow_rule.from) {
                    if *overflow > 0.0 {
                        let msg = match transfer {
                            CreditTransfer::OverflowCredit => {
                                if let Some(course_bank) =
                                    self.catalog.get_course_bank_by_name(&overflow_rule.from)
                                {
                                    if course_bank.credit.is_some() {
                                        Some(messages::credit_overflow_msg(
                                            *overflow,
                                            &overflow_rule.from,
                                            &overflow_rule.to,
                                        ))
                                    } else {
                                        None
                                    }
                                } else {
                                    None
                                }
                            }
                            CreditTransfer::OverflowCourses => {
                                Some(messages::courses_overflow_msg(
                                    *overflow,
                                    &overflow_rule.from,
                                    &overflow_rule.to,
                                ))
                            }
                            CreditTransfer::MissingCredit => Some(messages::missing_credit_msg(
                                *overflow,
                                &overflow_rule.from,
                                &overflow_rule.to,
                            )),
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

    fn handle_credit_overflow(
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

    fn handle_courses_overflow(
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

    fn calculate_credit_leftovers(&mut self) -> f32 {
        let mut sum_credit = 0.0;
        for credit_overflow in &mut self.credit_overflow_map.values() {
            sum_credit += *credit_overflow;
        }
        sum_credit
    }

    fn handle_bank_rule(
        &mut self,
        bank: &CourseBank,
        course_list_for_bank: Vec<CourseId>,
        credit_overflow: f32,
        missing_credit_from_prev_banks: f32,
        courses_overflow: u32,
    ) {
        let mut course_list = self.get_modified_courses(&bank.name);
        course_list.extend(course_list_for_bank);
        //course list includes all courses for this bank from the catalog and courses that the user marked manually that their type is this bank
        let bank_rule_handler = BankRuleHandler {
            user: self.user,
            bank_name: bank.name.clone(),
            course_list,
            courses: &self.courses,
            credit_overflow,
            courses_overflow,
            catalog_replacements: &self.catalog.catalog_replacements,
            common_replacements: &self.catalog.common_replacements,
        };

        // Initialize necessary variable for rules handling
        let mut sum_credit;
        let mut count_courses = 0; // for accumulate courses rule
        let mut missing_credit = 0.0; // for all rule
        let mut completed = true;
        let mut groups_done_list = Vec::new(); // for specialization groups rule
        let mut chain_done = Vec::new(); // for chain rule
        let mut msg = None;

        match &bank.rule {
            Rule::All => {
                sum_credit = bank_rule_handler.all(&mut missing_credit);
                if missing_credit > 0.0 {
                    self.missing_credit_map
                        .insert(bank.name.clone(), missing_credit);
                }
            }
            Rule::AccumulateCredit => sum_credit = bank_rule_handler.accumulate_credit(),
            Rule::AccumulateCourses(num_courses) => {
                sum_credit = bank_rule_handler.accumulate_courses(&mut count_courses);
                count_courses = self.handle_courses_overflow(bank, *num_courses, count_courses);
                completed = count_courses >= *num_courses;
            }
            Rule::Malag => sum_credit = bank_rule_handler.malag(&self.malag_courses),
            Rule::Sport => sum_credit = bank_rule_handler.sport(),
            Rule::FreeChoice => sum_credit = bank_rule_handler.free_choice(),
            Rule::Chains(chains) => {
                sum_credit = bank_rule_handler.chain(chains, &mut chain_done);
                completed = !chain_done.is_empty();
                if completed {
                    msg = Some(messages::completed_chain_msg(&chain_done));
                }
            }
            Rule::SpecializationGroups(specialization_groups) => {
                sum_credit = bank_rule_handler
                    .specialization_group(specialization_groups, &mut groups_done_list);
                completed = groups_done_list.len() >= specialization_groups.groups_number.into();
                msg = Some(messages::completed_specialization_groups_msg(
                    &groups_done_list,
                ));
            }
            Rule::Wildcard(_) => {
                sum_credit = 0.0; // TODO: change this
            }
        }

        let mut new_bank_credit = None;
        if let Some(bank_credit) = bank.credit {
            let new_credit = bank_credit - missing_credit + missing_credit_from_prev_banks;
            new_bank_credit = Some(new_credit);
            sum_credit = self.handle_credit_overflow(bank, new_credit, sum_credit);
            completed &= sum_credit >= new_credit;
        } else {
            sum_credit = self.handle_credit_overflow(bank, 0.0, sum_credit);
        };

        self.user
            .degree_status
            .course_bank_requirements
            .push(Requirement {
                course_bank_name: bank.name.clone(),
                bank_rule_name: bank.rule.to_string(),
                credit_requirement: new_bank_credit,
                course_requirement: if let Rule::AccumulateCourses(num_courses) = bank.rule {
                    Some(num_courses)
                } else {
                    None
                },
                credit_completed: sum_credit,
                course_completed: count_courses,
                completed,
                message: msg,
            });
    }

    fn handle_leftovers(&mut self) {
        for course_status in &self.user.degree_status.course_statuses {
            if course_status.r#type.is_none() && course_status.passed() {
                //Nissan cries
                self.user.degree_status.total_credit += course_status.course.credit;
            }
        }
    }

    pub fn compute(mut self) {
        for bank in self.course_banks.clone() {
            let course_list_for_bank = self.catalog.get_course_list(&bank.name);
            let credit_overflow =
                self.calculate_overflows(&bank.name, CreditTransfer::OverflowCredit);
            let missing_credit =
                self.calculate_overflows(&bank.name, CreditTransfer::MissingCredit);
            let courses_overflow =
                self.calculate_overflows(&bank.name, CreditTransfer::OverflowCourses) as u32;

            if bank.credit.is_none() {
                // Add a message where this bank's credit are counted.
                if let Some(to_bank_name) = self.find_next_bank_with_credit_requirement(&bank.name)
                {
                    self.user.degree_status.overflow_msgs.push(
                        messages::credit_overflow_detailed_msg(&bank.name, &to_bank_name),
                    );
                }
            }

            self.handle_bank_rule(
                &bank,
                course_list_for_bank,
                credit_overflow,
                missing_credit,
                courses_overflow,
            );
        }

        let credit_leftovers = self.calculate_credit_leftovers(); // if different from 0 then the user has extra credit he doesn't use
        self.user.degree_status.total_credit += credit_leftovers;
        self.user
            .degree_status
            .overflow_msgs
            .push(messages::credit_leftovers_msg(credit_leftovers));

        self.handle_leftovers(); // Need to consult with Nissan and Benny
    }
}

pub fn compute(
    mut catalog: Catalog,
    courses: HashMap<CourseId, Course>,
    malag_courses: Vec<CourseId>,
    user: &mut UserDetails,
) {
    let course_banks = toposort::set_order(&catalog.course_banks, &catalog.credit_overflows);
    reset_type_for_unmodified_and_irrelevant_courses(user);
    remove_irrelevant_courses_from_bank_requirements(user, &mut catalog);
    user.degree_status.course_statuses.sort_by(|c1, c2| {
        c1.extract_semester()
            .partial_cmp(&c2.extract_semester())
            .unwrap() // unwrap can't fail because we compare only integers or "half integers" (0.5,1,1.5,2,2.5...)
    });

    DegreeStatusHandler {
        user,
        course_banks,
        catalog,
        courses,
        malag_courses,
        credit_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    }
    .compute();
}
