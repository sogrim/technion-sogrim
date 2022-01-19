use crate::messages;
use crate::resources::catalog::{Catalog, OptionalReplacements};
use crate::resources::course::{Course, CourseBank, CourseId, CourseState, CourseStatus};
use crate::resources::user::UserDetails;
use bson::doc;
use petgraph::algo::toposort;
use petgraph::Graph;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub mod parser;

#[allow(clippy::float_cmp)]
#[cfg(test)]
pub mod tests;

type Chain = Vec<CourseId>;
type NumCourses = u32;
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SpecializationGroup {
    pub name: String,
    pub courses_sum: u8, //Indicates how many courses should the user accomplish in this specialization group
    pub course_list: Vec<CourseId>,

    // The user needs to pass one of the courses in each list. (To support complex requirements)
    // for example:
    // [[1,2],
    //  [3,4],
    //  [5,6]]
    // The user needs to pass the courses: (1 or 2), and (3 or 4), and (5 or 6).
    pub mandatory: Option<Vec<OptionalReplacements>>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SpecializationGroups {
    pub groups_list: Vec<SpecializationGroup>,
    pub groups_number: u8,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Rule {
    All,              //  כמו חובה פקולטית.
    AccumulateCredit, // לצבור איקס נקודות מתוך הבנק. למשל, רשימה א'
    AccumulateCourses(NumCourses),
    Malag,
    Sport,
    FreeChoice,
    Chains(Vec<Chain>), // למשל שרשרת מדעית.
    SpecializationGroups(SpecializationGroups),
    Wildcard(bool), // קלף משוגע עבור להתמודד עם
}

impl ToString for Rule {
    fn to_string(&self) -> String {
        match self {
            Rule::All => "all".into(),
            Rule::AccumulateCredit => "accumulate credit".into(),
            Rule::AccumulateCourses(_) => "accumulate courses".into(),
            Rule::Malag => "malag".into(),
            Rule::Sport => "sport".into(),
            Rule::FreeChoice => "free choice".into(),
            Rule::Chains(_) => "chains".into(),
            Rule::SpecializationGroups(_) => "specialization groups".into(),
            Rule::Wildcard(_) => "wildcard".into(),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CreditOverflow {
    pub from: String,
    pub to: String,
}

pub enum CreditsTransfer {
    OverflowCredits,
    MissingCredits,
    OverflowCourses,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Requirement {
    /*
    בזין הזה יש את כל הבנקים והאם בוצעו או לא בכל קטלוג
    */
    pub course_bank_name: String,
    pub bank_rule_name: String,
    pub credit_requirement: Option<f32>,
    pub course_requirement: Option<u32>,
    pub credit_completed: f32,
    pub course_completed: u32,
    pub completed: bool, //Is the user completed the necessary demands for this bank
    // TODO planing ...
    pub message: Option<String>,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct DegreeStatus {
    pub course_statuses: Vec<CourseStatus>,
    pub course_bank_requirements: Vec<Requirement>,
    pub overflow_msgs: Vec<String>,
    pub total_credit: f32,
}

pub struct CreditInfo {
    sum_credits: f32,
    count_courses: u32,
    missing_credit: f32,
    handled_courses: HashMap<CourseId, CourseId>, // A mapping between course in bank course list, to the course which was done by the user
}

pub fn set_order(
    course_banks: &[CourseBank],
    credit_overflow_rules: &[CreditOverflow],
) -> Vec<CourseBank> {
    let mut names_to_indices = HashMap::new();
    let mut indices_to_names = HashMap::new();
    let mut g = Graph::<String, ()>::new();
    for course_bank in course_banks {
        let node_idx = g.add_node(course_bank.name.clone());
        names_to_indices.insert(course_bank.name.clone(), node_idx);
        indices_to_names.insert(node_idx, course_bank.name.clone());
    }
    for credit_rule in credit_overflow_rules {
        g.add_edge(
            names_to_indices[&credit_rule.from],
            names_to_indices[&credit_rule.to],
            (),
        );
    }
    let order = toposort(&g, None).unwrap();
    let mut ordered_course_banks = Vec::<CourseBank>::new();
    for node in order {
        ordered_course_banks.push(
            course_banks
                .iter()
                .find(|c| c.name == indices_to_names[&node])
                .unwrap() // unwrap can't fail because we create this map such as to include all banks
                .clone(),
        );
    }
    ordered_course_banks
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

// This function sets the type of the course and adds its credit to sum_credits.
// Returns true if the credits have been added, false otherwise.
pub fn set_type_and_add_credits(
    course_status: &mut CourseStatus,
    bank_name: String,
    sum_credits: &mut f32,
) -> bool {
    course_status.set_type(bank_name);
    if course_status.passed() {
        *sum_credits += course_status.course.credit;
        true
    } else {
        false
    }
}

struct BankRuleHandler<'a> {
    user: &'a mut UserDetails,
    bank_name: String,
    course_list: Vec<CourseId>,
    courses: &'a HashMap<CourseId, Course>,
    credit_overflow: f32,
    courses_overflow: u32,
    catalog_replacements: &'a HashMap<CourseId, OptionalReplacements>,
    common_replacements: &'a HashMap<CourseId, OptionalReplacements>,
}

impl<'a> BankRuleHandler<'a> {
    fn iterate_course_list(&mut self) -> CreditInfo {
        // return sum_credits, count_courses, missing_points
        let mut sum_credits = self.credit_overflow;
        let mut count_courses = self.courses_overflow;
        let mut missing_credit = 0.0;
        let mut handled_courses = HashMap::new();
        for course_status in self.user.degree_status.course_statuses.iter_mut() {
            let mut course_chosen_for_bank = false;
            if course_status.valid_for_bank(&self.bank_name) {
                if self.course_list.contains(&course_status.course.id) {
                    course_chosen_for_bank = true;
                    handled_courses.insert(
                        course_status.course.id.clone(),
                        course_status.course.id.clone(),
                    );
                } else {
                    // check if course_status is a replacement for a course in course list
                    let mut course_id_in_list = None;
                    // First try to find catalog replacements
                    for course_id in &self.course_list {
                        if let Some(catalog_replacements) =
                            &self.catalog_replacements.get(course_id)
                        {
                            if catalog_replacements.contains(&course_status.course.id) {
                                course_id_in_list = Some(course_id);
                                if let Some(course) = self.courses.get(course_id) {
                                    course_status
                                        .set_msg(messages::catalog_replacements_msg(&course.name));
                                } else {
                                    // Shouldn't get here but to prevent crash in case of a bug we use the course id instead
                                    course_status
                                        .set_msg(messages::catalog_replacements_msg(course_id));
                                }
                                break;
                            }
                        }
                    }
                    if course_id_in_list.is_none() {
                        // Didn't find a catalog replacement so trying to find a common replacement
                        for course_id in &self.course_list {
                            if let Some(common_replacements) =
                                self.common_replacements.get(course_id)
                            {
                                if common_replacements.contains(&course_status.course.id) {
                                    course_id_in_list = Some(course_id);
                                    if let Some(course) = self.courses.get(course_id) {
                                        course_status.set_msg(messages::common_replacements_msg(
                                            &course.name,
                                        ));
                                    } else {
                                        // Shouldn't get here but to prevent crash in case of a bug we use the course id instead
                                        course_status
                                            .set_msg(messages::common_replacements_msg(course_id));
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if let Some(course_id) = course_id_in_list {
                        course_chosen_for_bank = true;
                        handled_courses.insert(course_id.clone(), course_status.course.id.clone());
                        if let Some(course) = self.courses.get(course_id) {
                            if course_status.course.credit < course.credit {
                                missing_credit += course.credit - course_status.course.credit;
                            }
                        }
                    }
                }
            }

            if course_chosen_for_bank
                && set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits)
            {
                count_courses += 1;
            }
        }

        CreditInfo {
            sum_credits,
            count_courses,
            missing_credit,
            handled_courses,
        }
    }

    pub fn all(mut self, missing_credit: &mut f32) -> f32 {
        let credit_info = self.iterate_course_list();

        // handle courses in course list which the user didn't complete or any replacement for them
        for course_id in &self.course_list {
            if !credit_info.handled_courses.contains_key(course_id) {
                let course = if let Some(course) = self.courses.get(course_id) {
                    course.clone()
                } else {
                    Course {
                        id: course_id.clone(),
                        credit: 0.0,
                        name: "שגיאה - קורס זה לא נמצא במאגר הקורסים של האתר".to_string(),
                    }
                };
                self.user.degree_status.course_statuses.push(CourseStatus {
                    course,
                    state: Some(CourseState::NotComplete),
                    r#type: Some(self.bank_name.clone()),
                    ..Default::default()
                });
            }
        }
        *missing_credit = credit_info.missing_credit;
        credit_info.sum_credits
    }

    pub fn accumulate_credit(mut self) -> f32 {
        let credit_info = self.iterate_course_list();
        credit_info.sum_credits
    }

    pub fn accumulate_courses(mut self, count_courses: &mut u32) -> f32 {
        let credit_info = self.iterate_course_list();
        *count_courses = credit_info.count_courses;
        credit_info.sum_credits
    }

    // TODO: remove this when removing the condition in the if statement
    #[allow(clippy::float_cmp)]
    pub fn malag(self, malag_courses: &[CourseId]) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && (malag_courses.contains(&course_status.course.id)
            // TODO: remove this line after we get the answer from the coordinates
            || (course_status.course.id.starts_with("324") && course_status.course.credit == 2.0)
            || course_status.r#type.is_some())
            // If type is not none it means valid_for_bank returns true because the user modified this course to be malag
            {
                set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits);
            }
        }
        sum_credits
    }

    pub fn sport(self) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && (course_status.is_sport() || course_status.r#type.is_some())
            // If type is not none it means valid_for_bank returns true because the user modified this course to be sport
            {
                set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits);
            }
        }
        sum_credits
    }

    pub fn free_choice(self) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && !(course_status.semester == None && course_status.course.credit == 0.0)
            {
                set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits);
            }
        }
        sum_credits
    }

    pub fn chain(mut self, chains: &[Chain], chain_done: &mut Vec<String>) -> f32 {
        let credit_info = self.iterate_course_list();
        for chain in chains {
            //check if the user completed one of the chains.
            let mut completed_chain = true;
            for course_id in chain {
                if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                    if let Some(course_status) = self.user.get_course_status(course_id) {
                        if course_status.passed() {
                            chain_done.push(course_status.course.name.clone());
                        } else {
                            completed_chain = false;
                            break;
                        }
                    }
                } else {
                    completed_chain = false;
                    break;
                }
            }
            if completed_chain {
                return credit_info.sum_credits;
            } else {
                chain_done.clear();
            }
        }
        credit_info.sum_credits
    }

    pub fn specialization_group(
        mut self,
        specialization_groups: &SpecializationGroups,
        completed_groups: &mut Vec<String>,
    ) -> f32 {
        let credit_info = self.iterate_course_list();
        for specialization_group in &specialization_groups.groups_list {
            //check if the user completed all the specialization groups requirements
            let mut completed_group = true;
            if let Some(mandatory) = &specialization_group.mandatory {
                for courses in mandatory {
                    let mut completed_current_demand = false;
                    for course_id in courses {
                        // check if the user completed one of courses
                        if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                            if let Some(course_status) = self.user.get_course_status(course_id) {
                                if course_status.passed()
                                    && course_status.specialization_group_name.is_none()
                                {
                                    completed_current_demand = true;
                                    break;
                                }
                            }
                        }
                    }
                    completed_group &= completed_current_demand;
                    if !completed_group {
                        // The user didn't completed one of the mandatory courses
                        break;
                    }
                }
            }
            if !completed_group {
                continue;
            }
            let mut chosen_courses = Vec::new();
            for course_id in &specialization_group.course_list {
                if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                    if let Some(course_status) = self.user.get_course_status(course_id) {
                        if course_status.passed()
                            && course_status.specialization_group_name.is_none()
                        {
                            chosen_courses.push(course_id.clone());
                        }
                        if (chosen_courses.len() as u8) == specialization_group.courses_sum {
                            // Until we implement exhaustive search on the specialization groups we should add this condition, so we cover more cases.
                            // when we find enough courses to finish this specialization group we don't need to check more courses, and then those courses can be taken to other groups.
                            break;
                        }
                    }
                }
            }
            completed_group &= (chosen_courses.len() as u8) == specialization_group.courses_sum;
            if completed_group {
                completed_groups.push(specialization_group.name.clone());
                for course_id in chosen_courses {
                    let course_status = self.user.get_mut_course_status(&course_id);
                    if let Some(course_status) = course_status {
                        course_status.set_specialization_group_name(&specialization_group.name);
                    }
                }
            }
        }

        credit_info.sum_credits
    }
}

struct DegreeStatusHandler<'a> {
    user: &'a mut UserDetails,
    course_banks: Vec<CourseBank>,
    catalog: Catalog,
    courses: HashMap<CourseId, Course>,
    malag_courses: Vec<CourseId>,
    credits_overflow_map: HashMap<String, f32>,
    missing_credit_map: HashMap<String, f32>,
    courses_overflow_map: HashMap<String, f32>,
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

    fn get_modified_courses(&self, bank_name: &str) -> Vec<CourseId> {
        let mut modified_courses = Vec::new();
        for course_status in &self.user.degree_status.course_statuses {
            if course_status.modified && course_status.r#type == Some(bank_name.to_string()) {
                modified_courses.push(course_status.course.id.clone());
            }
        }
        modified_courses
    }

    fn calculate_overflows(&mut self, bank_name: &str, transfer: CreditsTransfer) -> f32 {
        let mut sum = 0.0;
        let map = match transfer {
            CreditsTransfer::OverflowCredits => &mut self.credits_overflow_map,
            CreditsTransfer::MissingCredits => &mut self.missing_credit_map,
            CreditsTransfer::OverflowCourses => &mut self.courses_overflow_map,
        };
        for overflow_rule in &self.catalog.credit_overflows {
            if overflow_rule.to == bank_name {
                if let Some(overflow) = map.get_mut(&overflow_rule.from) {
                    if *overflow > 0.0 {
                        let msg = match transfer {
                            CreditsTransfer::OverflowCredits => {
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
                            CreditsTransfer::OverflowCourses => {
                                Some(messages::courses_overflow_msg(
                                    *overflow,
                                    &overflow_rule.from,
                                    &overflow_rule.to,
                                ))
                            }
                            CreditsTransfer::MissingCredits => Some(messages::missing_credit_msg(
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
        sum_credits: f32,
    ) -> f32 {
        if sum_credits <= bank_credit {
            self.user.degree_status.total_credit += sum_credits;
            sum_credits
        } else {
            match self.credits_overflow_map.get_mut(&bank.name) {
                Some(bank_overflow_item) => *bank_overflow_item += sum_credits - bank_credit,
                None => {
                    let _ = self
                        .credits_overflow_map
                        .insert(bank.name.clone(), sum_credits - bank_credit);
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
        let mut sum_credits = 0.0;
        for credit_overflow in &mut self.credits_overflow_map.values() {
            sum_credits += *credit_overflow;
        }
        sum_credits
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
        let mut sum_credits;
        let mut count_courses = 0; // for accumulate courses rule
        let mut missing_credit = 0.0; // for all rule
        let mut completed = true;
        let mut groups_done_list = Vec::new(); // for specialization groups rule
        let mut chain_done = Vec::new(); // for chain rule
        let mut msg = None;

        match &bank.rule {
            Rule::All => {
                sum_credits = bank_rule_handler.all(&mut missing_credit);
                if missing_credit > 0.0 {
                    self.missing_credit_map
                        .insert(bank.name.clone(), missing_credit);
                }
            }
            Rule::AccumulateCredit => sum_credits = bank_rule_handler.accumulate_credit(),
            Rule::AccumulateCourses(num_courses) => {
                sum_credits = bank_rule_handler.accumulate_courses(&mut count_courses);
                count_courses = self.handle_courses_overflow(bank, *num_courses, count_courses);
                completed = count_courses >= *num_courses;
            }
            Rule::Malag => sum_credits = bank_rule_handler.malag(&self.malag_courses),
            Rule::Sport => sum_credits = bank_rule_handler.sport(),
            Rule::FreeChoice => sum_credits = bank_rule_handler.free_choice(),
            Rule::Chains(chains) => {
                sum_credits = bank_rule_handler.chain(chains, &mut chain_done);
                completed = !chain_done.is_empty();
                if completed {
                    msg = Some(messages::completed_chain_msg(&chain_done));
                }
            }
            Rule::SpecializationGroups(specialization_groups) => {
                sum_credits = bank_rule_handler
                    .specialization_group(specialization_groups, &mut groups_done_list);
                completed = groups_done_list.len() >= specialization_groups.groups_number.into();
                msg = Some(messages::completed_specialization_groups_msg(
                    &groups_done_list,
                ));
            }
            Rule::Wildcard(_) => {
                sum_credits = 0.0; // TODO: change this
            }
        }

        let mut new_bank_credit = None;
        if let Some(bank_credit) = bank.credit {
            let new_credit = bank_credit - missing_credit + missing_credit_from_prev_banks;
            new_bank_credit = Some(new_credit);
            sum_credits = self.handle_credit_overflow(bank, new_credit, sum_credits);
            completed &= sum_credits >= new_credit;
        } else {
            sum_credits = self.handle_credit_overflow(bank, 0.0, sum_credits);
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
                credit_completed: sum_credits,
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

    pub fn process(mut self) {
        for bank in self.course_banks.clone() {
            let course_list_for_bank = self.catalog.get_course_list(&bank.name);
            let credit_overflow =
                self.calculate_overflows(&bank.name, CreditsTransfer::OverflowCredits);
            let missing_credit =
                self.calculate_overflows(&bank.name, CreditsTransfer::MissingCredits);
            let courses_overflow =
                self.calculate_overflows(&bank.name, CreditsTransfer::OverflowCourses) as u32;

            if bank.credit.is_none() {
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
        let credit_leftovers = self.calculate_credit_leftovers(); // if different from 0 then the user has extra credits he doesn't use
        self.user.degree_status.total_credit += credit_leftovers;
        self.user
            .degree_status
            .overflow_msgs
            .push(messages::credit_leftovers_msg(credit_leftovers));
        self.handle_leftovers(); // Need to consult with Nissan and Benny
    }
}

pub fn calculate_degree_status(
    mut catalog: Catalog,
    courses: HashMap<CourseId, Course>,
    malag_courses: Vec<CourseId>,
    user: &mut UserDetails,
) {
    let course_banks = set_order(&catalog.course_banks, &catalog.credit_overflows);
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
        credits_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    }
    .process();
}
