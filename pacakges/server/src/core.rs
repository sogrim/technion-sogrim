use crate::catalog::{Catalog, Replacements};
use crate::course::{Course, CourseBank, CourseState, CourseStatus};
use crate::user::UserDetails;
use bson::doc;
use petgraph::algo::toposort;
use petgraph::Graph;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

type Chain = Vec<u32>;
type NumCourses = u32;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Logic {
    Or,
    And,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Mandatory {
    courses: Vec<u32>,
    logic: Logic,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SpecializationGroup {
    pub name: String,
    pub credit: f32, // may be redundant, it seems that SpecializationGroup restrictions are number of courses and not number of credits
    pub courses_sum: u8, //Indicates how many courses should the user accomplish in this specialization group
    pub course_list: Vec<u32>,
    pub mandatory: Option<Mandatory>,
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
    pub overflow_msgs: Vec<String>,                 // זליגות של נקז ואיך טיפלנו בהם
    pub total_credit: f32,
}

pub struct CreditInfo {
    sum_credits: f32,
    count_courses: u32,
    missing_credits: f32
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
                .unwrap()
                .clone(),
        );
    }
    ordered_course_banks
}

pub fn reset_type_for_unmodified_courses(user_details: &mut UserDetails) {
    for course_status in &mut user_details.degree_status.course_statuses {
        if !course_status.modified {
            course_status.r#type = None;
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
    if course_status.r#type.is_none()
        || (course_status.modified && *course_status.r#type.as_ref().unwrap() == bank_name)
    {
        course_status.set_type(bank_name);
        course_status.modified = false; // finished handle this course
        if course_status.passed() {
            *sum_credits += course_status.course.credit;
            return true;
        }
    }
    false
}

struct BankRuleHandler<'a> {
    user: &'a mut UserDetails,
    bank_name: String,
    course_list: Vec<u32>,
    courses: &'a HashMap<u32, Course>,
    credit_overflow: f32,
    courses_overflow: Option<u32>,
    catalog_replacements: HashMap<u32, Replacements>
}

impl<'a> BankRuleHandler<'a> {
    // Tries to find a replacment course which was done and passed by the user, for the given course.
    // Returns the course number if found, and None otherwise.
    fn find_catalog_replacement(&self, course_number: u32) -> Option<u32> {
        if let Some(optional_replacements_for_course) = self.catalog_replacements.get(&course_number) {
            for optional_replacement in optional_replacements_for_course {
                if self.user.passed_course(optional_replacement.number) {
                    return Some(optional_replacement.number);
                }
            }
        }
        None
    }

    fn iterate_course_list(&mut self) -> CreditInfo { // return sum_credits, count_courses, missing_points
        let mut sum_credits = self.credit_overflow;
        let mut count_courses = match &self.courses_overflow {
            Some(num_courses) => *num_courses,
            None => 0,
        };
        let mut missing_credits = 0.0;
        for course_number in &self.course_list {
            let mut course_added = false;
            let course_replacement = self.find_catalog_replacement(*course_number);
            if let Some(course_status) = self.user.get_mut_course_status(*course_number) {
                if course_status.passed() || course_replacement.is_none() {
                    // The user completed and passed the necessary course or
                    // The user didn't pass the necessary course but didn't pass any of the optinal replacements either
                    course_added = set_type_and_add_credits(
                        course_status,
                        self.bank_name.clone(),
                        &mut sum_credits,
                    );
                }
            }
            else if course_replacement.is_some() { // The user didn't complete the necessary course but completed an optional replacement
                let course_replacement = self.user.get_mut_course_status(course_replacement.unwrap()).unwrap();
                course_added = set_type_and_add_credits(
                    course_replacement,
                    self.bank_name.clone(),
                    &mut sum_credits,
                );
                course_replacement.additional_msg = Some(format!("קורס זה מחליף את הקורס {}", self.courses[course_number].name));
                if course_replacement.course.credit < self.courses[course_number].credit {
                    missing_credits += self.courses[course_number].credit - course_replacement.course.credit;
                }
            }
            if course_added {
                count_courses += 1;
            }
        }
        CreditInfo {
            sum_credits,
            count_courses,
            missing_credits
        }
    }

    pub fn all(mut self, missing_credits: &mut f32) -> f32 {
        let credit_info = self.iterate_course_list();

        // handle courses in course list which the user didn't complete or any replacement for them
        for course_number in &self.course_list {
            if self.user.get_mut_course_status(*course_number).is_none() && self.find_catalog_replacement(*course_number).is_none() {
                self.user.degree_status.course_statuses.push(CourseStatus {
                    course: self.courses[course_number].clone(),
                    state: Some(CourseState::NotComplete),
                    r#type: Some(self.bank_name.clone()),
                    ..Default::default()
                });
            }
        }
        *missing_credits = credit_info.missing_credits;
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

    pub fn malag(self) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.is_malag() {
                set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits);
            }
        }
        sum_credits
    }

    pub fn sport(self) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.is_sport() {
                set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits);
            }
        }
        sum_credits
    }

    pub fn free_choice(self) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits);
        }
        sum_credits
    }

    pub fn chain(mut self, chains: &[Chain], chain_done: &mut Vec<String>) -> f32 {
        let credit_info = self.iterate_course_list();
        for chain in chains {
            //check if the user completed one of the chains.
            let mut completed_chain = true;
            for course_number in chain {
                if self.user.passed_course(*course_number) {
                    chain_done.push(self.user.get_mut_course_status(*course_number).unwrap().course.name.clone());
                } else {
                    let course_replacement = self.find_catalog_replacement(*course_number);
                    if let Some(course_replacement) = course_replacement {
                        chain_done.push(self.user.get_mut_course_status(course_replacement).unwrap().course.name.clone());
                    } else {
                        completed_chain = false;
                        break;
                    }
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
        //TODO: support replacements
        let credit_info = self.iterate_course_list();
        for specialization_group in &specialization_groups.groups_list {
            //check if the user completed all the specialization groups requirements
            let mut completed_group = true;
            if let Some(mandatory) = &specialization_group.mandatory {
                completed_group = matches!(&mandatory.logic, Logic::And);
                for course_number in &mandatory.courses {
                    match &mandatory.logic {
                        Logic::Or => completed_group |= self.user.passed_course(*course_number),
                        Logic::And => completed_group &= self.user.passed_course(*course_number),
                    }
                }
            }
            let mut count_courses = 0;
            for course_number in &specialization_group.course_list {
                if self.user.passed_course(*course_number) {
                    self.user
                        .degree_status
                        .course_statuses
                        .iter_mut()
                        .find(|c| c.course.number == *course_number)
                        .unwrap()
                        .set_msg(specialization_group.name.clone());
                    count_courses += 1;
                }
            }
            completed_group &= count_courses >= specialization_group.courses_sum;
            if completed_group {
                completed_groups.push(specialization_group.name.clone());
            }
        }

        credit_info.sum_credits
    }
}

struct DegreeStatusHandler<'a> {
    user: &'a mut UserDetails,
    course_banks: Vec<CourseBank>,
    catalog: Catalog,
    courses: HashMap<u32, Course>,
    credits_overflow_map: HashMap<String, f32>,
    missing_credits_map: HashMap<String, f32>,
    courses_overflow_map: HashMap<String, f32>,
}

impl<'a> DegreeStatusHandler<'a> {
    fn get_modified_courses(&self, bank_name: &str) -> Vec<u32> {
        let mut modified_courses = Vec::new();
        for course_status in &self.user.degree_status.course_statuses {
            if course_status.modified && course_status.r#type == Some(bank_name.to_string()) {
                modified_courses.push(course_status.course.number);
            }
        }
        modified_courses
    }

    fn calculate_overflows(&mut self, bank_name: &str, transfer: CreditsTransfer) -> f32 {
        let mut sum = 0.0;
        let map = match transfer {
            CreditsTransfer::OverflowCredits => &mut self.credits_overflow_map,
            CreditsTransfer::MissingCredits => &mut self.missing_credits_map,
            CreditsTransfer::OverflowCourses => &mut self.courses_overflow_map,
        };
        for overflow_rule in &self.catalog.credit_overflows {
            if overflow_rule.to == bank_name && map.contains_key(&overflow_rule.from) {
                let overflow = map[&overflow_rule.from];
                if overflow > 0.0 {
                    let msg = match transfer {
                        CreditsTransfer::OverflowCredits => {
                            format!(
                                "עברו {} נקודות מ{} ל{}",
                                overflow, &overflow_rule.from, &overflow_rule.to
                            )
                        },
                        CreditsTransfer::OverflowCourses => {
                            format!(
                                "עברו {} קורסים מ{} ל{}",
                                overflow, &overflow_rule.from, &overflow_rule.to
                            )
                        },
                        CreditsTransfer::MissingCredits => {
                            format!(
                                "ב{} היו {} נקודות חסרות שנוספו לדרישה של {}",
                                &overflow_rule.from, overflow, &overflow_rule.to
                            )
                        }
                    };
                    self.user.degree_status.overflow_msgs.push(msg);
                    *map.get_mut(&overflow_rule.from).unwrap() = 0.0;
                    sum += overflow
                }
            }
        }
        sum
    }

    fn handle_credit_overflow(&mut self, bank: &CourseBank, bank_credit: f32, sum_credits: f32) -> f32 {
        if sum_credits <= bank_credit {
            self.user.degree_status.total_credit += sum_credits;
            sum_credits
        } else {
            match self.credits_overflow_map.get_mut(&bank.name) {
                Some(bank_overflow_item) => *bank_overflow_item += sum_credits - bank_credit,
                None => { let _ = self.credits_overflow_map.insert(bank.name.clone(), sum_credits - bank_credit); }
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
        course_list_for_bank: Vec<u32>,
        credit_overflow: f32,
        missing_credits_from_prev_banks: f32,
        courses_overflow: Option<u32>,
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
            catalog_replacements: self.catalog.catalog_replacements.clone(),
        };

        // Initialize necessary variable for rules handling
        let mut sum_credits;
        let mut count_courses = 0; // for accumulate courses rule
        let mut missing_credits = 0.0; // for all rule
        let mut completed = true;
        let mut groups_done_list = Vec::new(); // for specialization groups rule
        let mut chain_done = Vec::new(); // for chain rule
        let mut msg = None;

        match &bank.rule {
            Rule::All => {
                sum_credits = bank_rule_handler.all(&mut missing_credits);
                if missing_credits > 0.0 {
                    self.missing_credits_map.insert(bank.name.clone(), missing_credits);
                    msg = Some(format!("בוצעו החלפות בין קורסים עם מספר קטן יותר של נקודות, לכן נוצרו {} נקודות חסרות שעברו הלאה.", missing_credits));
                }
            }
            Rule::AccumulateCredit => sum_credits = bank_rule_handler.accumulate_credit(),
            Rule::AccumulateCourses(num_courses) => {
                sum_credits = bank_rule_handler.accumulate_courses(&mut count_courses);
                count_courses = self.handle_courses_overflow(bank, *num_courses, count_courses);
                completed = count_courses >= *num_courses;
            }
            Rule::Malag => sum_credits = bank_rule_handler.malag(),
            Rule::Sport => sum_credits = bank_rule_handler.sport(),
            Rule::FreeChoice => sum_credits = bank_rule_handler.free_choice(),
            Rule::Chains(chains) => {
                sum_credits = bank_rule_handler.chain(chains, &mut chain_done);
                completed = !chain_done.is_empty();
                if completed {
                    let mut new_msg = "הסטודנט השלים את השרשרת הבאה:\n".to_string();
                    for course in chain_done {
                        new_msg += &format!("{},", course);
                    }
                    msg = Some(new_msg);
                }
            }
            Rule::SpecializationGroups(specialization_groups) => {
                sum_credits = bank_rule_handler
                    .specialization_group(specialization_groups, &mut groups_done_list);
                completed = groups_done_list.len() >= specialization_groups.groups_number.into();
                let mut new_msg = format!("הסטודנט השלים {} קבוצות התמחות", groups_done_list.len());
                for group_done in groups_done_list {
                    new_msg += &format!("{}\n", group_done);
                }
                msg = Some(new_msg);
            }
            Rule::Wildcard(_) => {
                sum_credits = 0.0; // TODO: change this
            }
        }
        let new_bank_credit = if let Some(bank_credit) = bank.credit {
            Some(bank_credit - missing_credits + missing_credits_from_prev_banks)
        } else {
            sum_credits = self.handle_credit_overflow(bank, 0.0, sum_credits);
            None
        };
        if new_bank_credit.is_some() {
            sum_credits = self.handle_credit_overflow(bank, new_bank_credit.unwrap(), sum_credits);
            completed &= sum_credits >= new_bank_credit.unwrap();
        }

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
            let credit_overflow = self.calculate_overflows(&bank.name, CreditsTransfer::OverflowCredits);
            let missing_credits = self.calculate_overflows(&bank.name, CreditsTransfer::MissingCredits);
            let mut courses_overflow = None;
            if matches!(bank.rule, Rule::AccumulateCourses(_)) {
                courses_overflow = Some(self.calculate_overflows(&bank.name, CreditsTransfer::OverflowCourses) as u32);
            }
            self.handle_bank_rule(
                &bank,
                course_list_for_bank,
                credit_overflow,
                missing_credits,
                courses_overflow
            );
        }
        let credit_leftovers = self.calculate_credit_leftovers(); // if different from 0 then the user has extra credits he doesn't use
        self.user.degree_status.total_credit += credit_leftovers;
        self.user
            .degree_status
            .overflow_msgs
            .push(format!("יש לסטודנט {} נקודות עודפות", credit_leftovers));
        self.handle_leftovers(); // Need to consult with Nissan and Benny
    }
}

pub fn calculate_degree_status(
    catalog: Catalog,
    courses: HashMap<u32, Course>,
    user: &mut UserDetails,
) {
    let course_banks = set_order(&catalog.course_banks, &catalog.credit_overflows);
    reset_type_for_unmodified_courses(user);

    DegreeStatusHandler {
        user,
        course_banks,
        catalog,
        courses,
        credits_overflow_map: HashMap::new(),
        missing_credits_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    }
    .process();
}

#[allow(clippy::float_cmp)]
#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::CONFIG;
    use crate::{
        course::{self, Grade},
        db,
    };
    use actix_rt::test;
    use dotenv::dotenv;
    use std::str::FromStr;

    fn create_user() -> UserDetails {
        UserDetails {
            catalog: None,
            degree_status: DegreeStatus {
                course_statuses: vec![
                    CourseStatus {
                        course: Course {
                            number: 104031,
                            credit: 5.5,
                            name: "infi1m".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            number: 104166,
                            credit: 5.5,
                            name: "Algebra alef".to_string(),
                        },
                        state: Some(CourseState::NotComplete),
                        grade: Some(Grade::Binary(false)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            number: 114052,
                            credit: 3.5,
                            name: "פיסיקה 2".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            number: 114054,
                            credit: 3.5,
                            name: "פיסיקה 3".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            number: 236303,
                            credit: 3.0,
                            name: "project1".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            number: 236512,
                            credit: 3.0,
                            name: "project2".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            number: 324057, // Malag
                            credit: 2.0,
                            name: "mlg".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(99)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            number: 394645, // Sport
                            credit: 1.0,
                            name: "sport".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(100)),
                        ..Default::default()
                    },
                ],
                course_bank_requirements: Vec::<Requirement>::new(),
                overflow_msgs: Vec::<String>::new(),
                total_credit: 0.0,
            },
            modified: false,
        }
    }

    #[test]
    async fn test_rule_all() {
        // for debugging
        let mut user = create_user();
        let bank_name = "hova".to_string();
        let courses = HashMap::from([
            (104031, Course {
                number: 104031,
                credit: 5.5,
                name: "infi1m".to_string()
            }),
            (104166, Course {
                number: 104166,
                credit: 5.5,
                name: "Algebra alef".to_string()
            }),
            (1, Course {
                number: 1,
                credit: 1.0,
                name: "".to_string()
            }),
            (2, Course {
                number: 2,
                credit: 2.0,
                name: "".to_string()
            }),
            (3, Course {
                number: 3,
                credit: 3.0,
                name: "".to_string()
            }),
        ]);
        let course_list = vec![104031, 104166, 1, 2, 3];    
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &courses,
            credit_overflow,
            courses_overflow: None,
            catalog_replacements: HashMap::new()
        };
        let mut missing_credits_dummy = 0.0;
        let res = handle_bank_rule_processor.all(&mut missing_credits_dummy);
        // check it adds the type
        assert_eq!(
            user.degree_status.course_statuses[0].r#type,
            Some("hova".to_string())
        );
        assert_eq!(
            user.degree_status.course_statuses[1].r#type,
            Some("hova".to_string())
        );

        // check it adds the not completed courses in the hove bank
        assert_eq!(user.degree_status.course_statuses[8].course.number, 1);
        assert!(matches!(
            user.degree_status.course_statuses[8].state,
            Some(CourseState::NotComplete)
        ));

        assert_eq!(user.degree_status.course_statuses[9].course.number, 2);
        assert!(matches!(
            user.degree_status.course_statuses[9].state,
            Some(CourseState::NotComplete)
        ));

        assert_eq!(user.degree_status.course_statuses[10].course.number, 3);
        assert!(matches!(
            user.degree_status.course_statuses[10].state,
            Some(CourseState::NotComplete)
        ));

        // check sum credits
        assert_eq!(res, 5.5);
    }

    #[test]
    async fn test_rule_accumulate_credit() {
        // for debugging
        let mut user = create_user();
        let bank_name = "reshima a".to_string();
        let course_list = vec![ 236303, 236512, 1, 2];
        let credit_overflow = 5.5;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow,
            courses_overflow: None,
            catalog_replacements: HashMap::new()
        };
        let res = handle_bank_rule_processor.accumulate_credit();
        // check it adds the type
        assert_eq!(user.degree_status.course_statuses[0].r#type, None);
        assert_eq!(user.degree_status.course_statuses[1].r#type, None);
        assert_eq!(user.degree_status.course_statuses[2].r#type, None);
        assert_eq!(user.degree_status.course_statuses[3].r#type, None);
        assert_eq!(
            user.degree_status.course_statuses[4].r#type,
            Some("reshima a".to_string())
        );
        assert_eq!(
            user.degree_status.course_statuses[5].r#type,
            Some("reshima a".to_string())
        );
        assert_eq!(user.degree_status.course_statuses[6].r#type, None);
        assert_eq!(user.degree_status.course_statuses[7].r#type, None);
        assert_eq!(user.degree_status.course_statuses.len(), 8);

        // check sum credits
        assert_eq!(res, 11.5);
    }

    #[test]
    async fn test_rule_accumulate_courses() {
        // for debugging
        let mut user = create_user();
        let bank_name = "Project".to_string();
        let course_list = vec![236303, 236512, 1, 2];
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow,
            courses_overflow: Some(1),
            catalog_replacements: HashMap::new()
        };
        let mut count_courses = 0;
        let res = handle_bank_rule_processor.accumulate_courses(&mut count_courses);
        // check it adds the type
        assert_eq!(user.degree_status.course_statuses[0].r#type, None);
        assert_eq!(user.degree_status.course_statuses[1].r#type, None);
        assert_eq!(user.degree_status.course_statuses[2].r#type, None);
        assert_eq!(user.degree_status.course_statuses[3].r#type, None);
        assert_eq!(
            user.degree_status.course_statuses[4].r#type,
            Some("Project".to_string())
        );
        assert_eq!(
            user.degree_status.course_statuses[5].r#type,
            Some("Project".to_string())
        );
        assert_eq!(user.degree_status.course_statuses[6].r#type, None);
        assert_eq!(user.degree_status.course_statuses[7].r#type, None);
        assert_eq!(user.degree_status.course_statuses.len(), 8);

        //check num courses
        assert_eq!(count_courses, 3);

        // check sum credits
        assert_eq!(res, 6.0);
    }

    #[test]
    async fn test_rule_chain() {
        // for debugging
        // user finished a chain
        let mut user = create_user();
        let bank_name = "science chain".to_string();
        let course_list = vec![1, 2, 114052, 5, 114054, 111111];
        let chains = vec![
            vec![1, 2],
            vec![114052, 5],
            vec![114052, 114054],
            vec![114052, 111111],
        ];
        let mut chain_done = Vec::new();
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow,
            courses_overflow: None,
            catalog_replacements: HashMap::new()
        };
        let res = handle_bank_rule_processor.chain(&chains, &mut chain_done);
        // check it adds the type
        assert_eq!(user.degree_status.course_statuses[0].r#type, None);
        assert_eq!(user.degree_status.course_statuses[1].r#type, None);
        assert_eq!(
            user.degree_status.course_statuses[2].r#type,
            Some("science chain".to_string())
        );
        assert_eq!(
            user.degree_status.course_statuses[3].r#type,
            Some("science chain".to_string())
        );
        assert_eq!(user.degree_status.course_statuses[4].r#type, None);
        assert_eq!(user.degree_status.course_statuses[5].r#type, None);
        assert_eq!(user.degree_status.course_statuses[6].r#type, None);
        assert_eq!(user.degree_status.course_statuses[7].r#type, None);
        assert_eq!(user.degree_status.course_statuses.len(), 8);

        // check sum credits
        assert_eq!(chain_done, vec!["פיסיקה 2".to_string(), "פיסיקה 3".to_string()]);
        assert_eq!(res, 7.0);

        // user didn't finish a chain
        let mut user = create_user();
        let bank_name = "science chain".to_string();
        let course_list = vec![1, 2, 114052, 5, 114054, 111111];
        let chains = vec![
            vec![1, 2],
            vec![114052, 5],
            vec![222222, 114054],
            vec![114052, 111111],
        ];
        let mut chain_done = Vec::new();
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow,
            courses_overflow: None,
            catalog_replacements: HashMap::new()
        };
        let res = handle_bank_rule_processor.chain(&chains, &mut chain_done);

        assert!(chain_done.is_empty());
        assert_eq!(res, 7.0);
    }

    #[test]
    async fn test_rule_malag() {
        // for debugging
        let mut user = create_user();
        let bank_name = "MALAG".to_string();
        let course_list = vec![1, 2]; // this list shouldn't affect anything
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow,
            courses_overflow: None,
            catalog_replacements: HashMap::new()
        };
        let res = handle_bank_rule_processor.malag();

        // check it adds the type
        assert_eq!(user.degree_status.course_statuses[0].r#type, None);
        assert_eq!(user.degree_status.course_statuses[1].r#type, None);
        assert_eq!(user.degree_status.course_statuses[2].r#type, None);
        assert_eq!(user.degree_status.course_statuses[3].r#type, None);
        assert_eq!(user.degree_status.course_statuses[4].r#type, None);
        assert_eq!(user.degree_status.course_statuses[5].r#type, None);
        assert_eq!(
            user.degree_status.course_statuses[6].r#type,
            Some("MALAG".to_string())
        );
        assert_eq!(user.degree_status.course_statuses[7].r#type, None);
        assert_eq!(user.degree_status.course_statuses.len(), 8);

        // check sum credits
        assert_eq!(res, 2.0);
    }

    #[test]
    async fn test_rule_sport() {
        // for debugging
        let mut user = create_user();
        let bank_name = "SPORT".to_string();
        let course_list = vec![1, 2]; // this list shouldn't affect anything
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow,
            courses_overflow: None,
            catalog_replacements: HashMap::new()
        };
        let res = handle_bank_rule_processor.sport();

        // check it adds the type
        assert_eq!(user.degree_status.course_statuses[0].r#type, None);
        assert_eq!(user.degree_status.course_statuses[1].r#type, None);
        assert_eq!(user.degree_status.course_statuses[2].r#type, None);
        assert_eq!(user.degree_status.course_statuses[3].r#type, None);
        assert_eq!(user.degree_status.course_statuses[4].r#type, None);
        assert_eq!(user.degree_status.course_statuses[5].r#type, None);
        assert_eq!(user.degree_status.course_statuses[6].r#type, None);
        assert_eq!(
            user.degree_status.course_statuses[7].r#type,
            Some("SPORT".to_string())
        );
        assert_eq!(user.degree_status.course_statuses.len(), 8);

        // check sum credits
        assert_eq!(res, 1.0);
    }

    #[test]
    async fn test_modified() {
        // for debugging
        let mut user = create_user();
        user.degree_status.course_statuses[0].r#type = Some("reshima alef".to_string()); // the user modified the type of 104031 to be reshima alef
        user.degree_status.course_statuses[0].modified = true;
        let bank_name = "hova".to_string();
        let course_list = vec![104031, 104166]; // although 104031 is in the list, it shouldn't be taken because the user modified its type
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow,
            courses_overflow: None,
            catalog_replacements: HashMap::new()
        };
        let mut missing_credits_dummy = 0.0;
        let res = handle_bank_rule_processor.all(&mut missing_credits_dummy);

        // check it adds the type
        assert_eq!(
            user.degree_status.course_statuses[0].r#type,
            Some("reshima alef".to_string())
        );
        assert_eq!(
            user.degree_status.course_statuses[1].r#type,
            Some("hova".to_string())
        );
        assert_eq!(user.degree_status.course_statuses[2].r#type, None);
        assert_eq!(user.degree_status.course_statuses[3].r#type, None);
        assert_eq!(user.degree_status.course_statuses[4].r#type, None);
        assert_eq!(user.degree_status.course_statuses[5].r#type, None);
        assert_eq!(user.degree_status.course_statuses[6].r#type, None);
        assert_eq!(user.degree_status.course_statuses[7].r#type, None);
        assert_eq!(user.degree_status.course_statuses.len(), 8);

        // check sum credits
        assert_eq!(res, 0.0);

        let mut user = create_user();
        user.degree_status.course_statuses[2].r#type = Some("hova".to_string()); // the user modified the type of 114052 to be hova
        user.degree_status.course_statuses[2].modified = true;
        user.degree_status.course_statuses[3].r#type = Some("reshima alef".to_string()); // the user modified the type of 114054 to be reshima alef
        user.degree_status.course_statuses[3].modified = true;
        let bank_name = "hova".to_string();
        let mut course_list = vec![104031, 104166];
        // create DegreeStatusHandler so we can run the function get_modified_courses
        let catalog = Catalog {
            ..Default::default()
        };
        let degree_status_handler = DegreeStatusHandler {
            user: &mut user,
            course_banks: Vec::new(),
            catalog,
            courses: HashMap::new(),
            credits_overflow_map: HashMap::new(),
            missing_credits_map: HashMap::new(),
            courses_overflow_map: HashMap::new(),
        };

        course_list.extend(degree_status_handler.get_modified_courses(&bank_name)); // should take only 114052

        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow,
            courses_overflow: None,
            catalog_replacements: HashMap::new()
        };
        let res = handle_bank_rule_processor.all(&mut missing_credits_dummy);

        // check it adds the type
        assert_eq!(
            user.degree_status.course_statuses[2].r#type,
            Some("hova".to_string())
        );
        assert_eq!(
            user.degree_status.course_statuses[3].r#type,
            Some("reshima alef".to_string())
        );
        assert_eq!(user.degree_status.course_statuses.len(), 8);

        // check sum credits
        assert_eq!(res, 9.0);
    }

    //TODO uncomment this when secrets are added.
    #[test]
    async fn test_legendary_function() {

        dotenv().ok();
        let options = mongodb::options::ClientOptions::parse(CONFIG.uri)
            .await
            .expect("failed to parse URI");

        let client = mongodb::Client::with_options(options).unwrap();
        // Ping the server to see if you can connect to the cluster
        client
            .database("admin")
            .run_command(bson::doc! {"ping": 1}, None)
            .await
            .expect("failed to connect to db");
        println!("Connected successfully.");
        let contents = std::fs::read_to_string("../docs/ug_ctrl_c_ctrl_v.txt")
            .expect("Something went wrong reading the file");

        let course_statuses =
            course::parse_copy_paste_data(&contents).expect("failed to parse courses data");

        let obj_id = bson::oid::ObjectId::from_str("61a102bb04c5400b98e6f401")
            .expect("failed to create oid");
        let catalog = db::services::get_catalog_by_id(&obj_id, &client)
            .await
            .expect("failed to get catalog");
        let mut user = UserDetails {
            catalog: None,
            degree_status: DegreeStatus {
                course_statuses,
                ..Default::default()
            },
            modified: false,
        };
        let vec_courses = db::services::get_all_courses(&client)
            .await
            .expect("failed to get all courses");

        calculate_degree_status(catalog, course::vec_to_map(vec_courses), &mut user);
        //FOR VIEWING IN JSON FORMAT
        // std::fs::write(
        //     "degree_status.json",
        //     serde_json::to_string_pretty(&user.degree_status).expect("json serialization failed"),
        // )
        // .expect("Unable to write file");

        // check output
        assert_eq!(
            user.degree_status.course_bank_requirements[0].credit_requirement,
            Some(2.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[0].credit_completed,
            1.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[1].credit_requirement,
            Some(6.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[1].credit_completed,
            6.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[2].course_requirement,
            Some(1)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[2].course_completed,
            0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[3].credit_requirement,
            Some(18.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[3].credit_completed,
            15.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[4].credit_requirement,
            Some(2.5)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[4].course_requirement,
            Some(1)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[4].credit_completed,
            2.5
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[4].course_completed,
            1
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[5].credit_requirement,
            Some(8.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[5].credit_completed,
            8.0
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[5].message,
            Some("הסטודנט השלים את השרשרת הבאה:\n114075,".to_string())
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[6].credit_requirement,
            Some(73.5)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[6].credit_completed,
            73.5
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[7].credit_requirement,
            Some(6.5)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[7].credit_completed,
            0.5
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[8].credit_requirement,
            Some(2.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[8].credit_completed,
            0.0
        );

        assert_eq!(
            user.degree_status.overflow_msgs[0],
            "עברו 0.5 נקודות משרשרת מדעית לרשימה ב".to_string()
        );
        assert_eq!(
            user.degree_status.overflow_msgs[1],
            "יש לסטודנט 0 נקודות עודפות".to_string()
        );
    }
}
