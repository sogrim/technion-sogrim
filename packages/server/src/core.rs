use crate::catalog::{Catalog, OptionalReplacements};
use crate::course::{Course, CourseBank, CourseId, CourseState, CourseStatus};
use crate::user::UserDetails;
use bson::doc;
use petgraph::algo::toposort;
use petgraph::Graph;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

type Chain = Vec<CourseId>;
type NumCourses = u32;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Logic {
    Or,
    And,
}

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
    pub overflow_msgs: Vec<String>, // זליגות של נקז ואיך טיפלנו בהם
    pub total_credit: f32,
}

pub struct CreditInfo {
    sum_credits: f32,
    count_courses: u32,
    missing_credits: f32,
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
        let mut missing_credits = 0.0;
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
                                        .set_msg(format!("קורס זה מחליף את הקורס {}", course.name));
                                } else {
                                    // Shouldn't get here but to prevent crash in case of a bug we use the course id instead
                                    course_status
                                        .set_msg(format!("קורס זה מחליף את הקורס {}", course_id));
                                }
                                break;
                            }
                        }
                    }
                    if course_id_in_list.is_none() {
                        // Didn't find a catalog replacement so trying to find a common replacement
                        for course_id in &self.course_list {
                            if let Some(common_replacements) =
                                &self.common_replacements.get(course_id)
                            {
                                if common_replacements.contains(&course_status.course.id) {
                                    course_id_in_list = Some(course_id);
                                    if let Some(course) = self.courses.get(course_id) {
                                        course_status.set_msg(format!(
                                            "הנחנו כי קורס זה מחליף את הקורס {} בעקבות החלפות נפוצות.\n נא לשים לב כי נדרש אישור מהרכזות בשביל החלפה זו",
                                            course.name
                                        ));
                                    } else {
                                        // Shouldn't get here but to prevent crash in case of a bug we use the course id instead
                                        course_status.set_msg(format!(
                                            "הנחנו כי קורס זה מחליף את הקורס {} בעקבות החלפות נפוצות.\n נא לשים לב כי נדרש אישור מהרכזות בשביל החלפה זו", course_id
                                        ));
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
                                missing_credits += course.credit - course_status.course.credit;
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
            missing_credits,
            handled_courses,
        }
    }

    pub fn all(mut self, missing_credits: &mut f32) -> f32 {
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
    missing_credits_map: HashMap<String, f32>,
    courses_overflow_map: HashMap<String, f32>,
}

impl<'a> DegreeStatusHandler<'a> {
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
            CreditsTransfer::MissingCredits => &mut self.missing_credits_map,
            CreditsTransfer::OverflowCourses => &mut self.courses_overflow_map,
        };
        for overflow_rule in &self.catalog.credit_overflows {
            if overflow_rule.to == bank_name {
                if let Some(overflow_rule_from) = map.get_mut(&overflow_rule.from) {
                    let overflow = *overflow_rule_from;
                    if overflow > 0.0 {
                        let msg = match transfer {
                            CreditsTransfer::OverflowCredits => {
                                format!(
                                    "עברו {} נקודות מ{} ל{}",
                                    overflow, &overflow_rule.from, &overflow_rule.to
                                )
                            }
                            CreditsTransfer::OverflowCourses => {
                                format!(
                                    "עברו {} קורסים מ{} ל{}",
                                    overflow, &overflow_rule.from, &overflow_rule.to
                                )
                            }
                            CreditsTransfer::MissingCredits => {
                                format!(
                                    "ב{} היו {} נקודות חסרות שנוספו לדרישה של {}",
                                    &overflow_rule.from, overflow, &overflow_rule.to
                                )
                            }
                        };
                        self.user.degree_status.overflow_msgs.push(msg);
                        *overflow_rule_from = 0.0;
                        sum += overflow
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
        missing_credits_from_prev_banks: f32,
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
        let mut missing_credits = 0.0; // for all rule
        let mut completed = true;
        let mut groups_done_list = Vec::new(); // for specialization groups rule
        let mut chain_done = Vec::new(); // for chain rule
        let mut msg = None;

        match &bank.rule {
            Rule::All => {
                sum_credits = bank_rule_handler.all(&mut missing_credits);
                if missing_credits > 0.0 {
                    self.missing_credits_map
                        .insert(bank.name.clone(), missing_credits);
                    msg = Some(format!("בוצעו החלפות בין קורסים עם מספר קטן יותר של נקודות, לכן נוצרו {} נקודות חסרות שעברו הלאה.", missing_credits));
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
                    let mut new_msg = "הסטודנט השלים את השרשרת הבאה:\n".to_string();
                    for course in chain_done {
                        new_msg += &format!("{}\n", course);
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

        let mut new_bank_credit = None;
        if let Some(bank_credit) = bank.credit {
            let new_credit = bank_credit - missing_credits + missing_credits_from_prev_banks;
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
            let missing_credits =
                self.calculate_overflows(&bank.name, CreditsTransfer::MissingCredits);
            let courses_overflow =
                self.calculate_overflows(&bank.name, CreditsTransfer::OverflowCourses) as u32;

            self.handle_bank_rule(
                &bank,
                course_list_for_bank,
                credit_overflow,
                missing_credits,
                courses_overflow,
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
    use lazy_static::lazy_static;
    use std::str::FromStr;

    lazy_static! {
        static ref COURSES: HashMap<String, Course> = HashMap::from([
            (
                "104031".to_string(),
                Course {
                    id: "104031".to_string(),
                    credit: 5.5,
                    name: "infi1m".to_string(),
                },
            ),
            (
                "104166".to_string(),
                Course {
                    id: "104166".to_string(),
                    credit: 5.5,
                    name: "Algebra alef".to_string(),
                },
            ),
            (
                "114052".to_string(),
                Course {
                    id: "114052".to_string(),
                    credit: 3.5,
                    name: "פיסיקה 2".to_string(),
                },
            ),
            (
                "114054".to_string(),
                Course {
                    id: "114054".to_string(),
                    credit: 3.5,
                    name: "פיסיקה 3".to_string(),
                },
            ),
            (
                "236303".to_string(),
                Course {
                    id: "236303".to_string(),
                    credit: 3.0,
                    name: "project1".to_string(),
                },
            ),
            (
                "236512".to_string(),
                Course {
                    id: "236512".to_string(),
                    credit: 3.0,
                    name: "project2".to_string(),
                },
            ),
            (
                "1".to_string(),
                Course {
                    id: "1".to_string(),
                    credit: 1.0,
                    name: "".to_string(),
                },
            ),
            (
                "2".to_string(),
                Course {
                    id: "2".to_string(),
                    credit: 2.0,
                    name: "".to_string(),
                },
            ),
            (
                "3".to_string(),
                Course {
                    id: "3".to_string(),
                    credit: 3.0,
                    name: "".to_string(),
                },
            ),
        ]);
    }

    #[macro_export]
    macro_rules! create_bank_rule_handler {
        ($user:expr, $bank_name:expr, $course_list:expr, $credit_overflow:expr, $courses_overflow:expr) => {
            BankRuleHandler {
                user: $user,
                bank_name: $bank_name,
                course_list: $course_list,
                courses: &COURSES,
                credit_overflow: $credit_overflow,
                courses_overflow: $courses_overflow,
                catalog_replacements: &HashMap::new(),
                common_replacements: &HashMap::new(),
            }
        };
    }

    fn create_user() -> UserDetails {
        UserDetails {
            catalog: None,
            degree_status: DegreeStatus {
                course_statuses: vec![
                    CourseStatus {
                        course: Course {
                            id: "104031".to_string(),
                            credit: 5.5,
                            name: "infi1m".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            id: "104166".to_string(),
                            credit: 5.5,
                            name: "Algebra alef".to_string(),
                        },
                        state: Some(CourseState::NotComplete),
                        grade: Some(Grade::Binary(false)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            id: "114052".to_string(),
                            credit: 3.5,
                            name: "פיסיקה 2".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            id: "114054".to_string(),
                            credit: 3.5,
                            name: "פיסיקה 3".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            id: "236303".to_string(),
                            credit: 3.0,
                            name: "project1".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            id: "236512".to_string(),
                            credit: 3.0,
                            name: "project2".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            id: "324057".to_string(), // Malag
                            credit: 2.0,
                            name: "mlg".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(99)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            id: "394645".to_string(), // Sport
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
        let course_list = vec![
            "104031".to_string(),
            "104166".to_string(),
            "1".to_string(),
            "2".to_string(),
            "3".to_string(),
        ];
        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
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
        assert_eq!(
            user.degree_status.course_statuses[8].course.id,
            "1".to_string()
        );
        assert!(matches!(
            user.degree_status.course_statuses[8].state,
            Some(CourseState::NotComplete)
        ));

        assert_eq!(
            user.degree_status.course_statuses[9].course.id,
            "2".to_string()
        );
        assert!(matches!(
            user.degree_status.course_statuses[9].state,
            Some(CourseState::NotComplete)
        ));

        assert_eq!(
            user.degree_status.course_statuses[10].course.id,
            "3".to_string()
        );
        assert!(matches!(
            user.degree_status.course_statuses[10].state,
            Some(CourseState::NotComplete)
        ));

        // check sum credits
        assert_eq!(res, 5.5);
    }

    #[test]
    async fn test_irrelevant_course() {
        // for debugging
        let mut user = create_user();
        user.degree_status.course_statuses[2].state = Some(CourseState::Irrelevant); // change 114052 to be irrelevant
        let bank_name = "hova".to_string();
        let course_list = vec!["104031".to_string(), "114052".to_string()];
        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
        let mut missing_credits_dummy = 0.0;
        handle_bank_rule_processor.all(&mut missing_credits_dummy);

        assert_eq!(user.degree_status.course_statuses[2].r#type, None);
    }

    #[test]
    async fn test_rule_accumulate_credit() {
        // for debugging
        let mut user = create_user();
        let bank_name = "reshima a".to_string();
        let course_list = vec![
            "236303".to_string(),
            "236512".to_string(),
            "1".to_string(),
            "2".to_string(),
        ];
        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name, course_list, 5.5, 0);
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
        let course_list = vec![
            "236303".to_string(),
            "236512".to_string(),
            "1".to_string(),
            "2".to_string(),
        ];
        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 1);
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
        let mut user = create_user();
        let bank_name = "science chain".to_string();
        let course_list = vec![
            "1".to_string(),
            "2".to_string(),
            "114052".to_string(),
            "5".to_string(),
            "114054".to_string(),
            "111111".to_string(),
        ];
        let mut chains = vec![
            vec!["1".to_string(), "2".to_string()],
            vec!["114052".to_string(), "5".to_string()],
            vec!["222222".to_string(), "114054".to_string()],
            vec!["114052".to_string(), "111111".to_string()],
        ];

        let mut chain_done = Vec::new();
        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name.clone(), course_list.clone(), 0.0, 0);
        // user didn't finish a chain
        let res = handle_bank_rule_processor.chain(&chains, &mut chain_done);

        assert!(chain_done.is_empty());
        assert_eq!(res, 7.0);

        // ---------------------------------------------------------------------------
        user = create_user();
        chains.push(vec!["114052".to_string(), "114054".to_string()]); // user finished the chain [114052, 114054]
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow: 0.0,
            courses_overflow: 0,
            catalog_replacements: &HashMap::new(),
            common_replacements: &HashMap::new(),
        };
        let res = handle_bank_rule_processor.chain(&chains, &mut chain_done);
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
        assert_eq!(
            chain_done,
            vec!["פיסיקה 2".to_string(), "פיסיקה 3".to_string()]
        );
        assert_eq!(res, 7.0);
    }

    #[test]
    async fn test_rule_malag() {
        // for debugging
        let mut user = create_user();
        let bank_name = "MALAG".to_string();
        let course_list = vec!["1".to_string(), "2".to_string()]; // this list shouldn't affect anything
        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
        let res = handle_bank_rule_processor.malag(&["324057".to_string()]);

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
        let course_list = vec!["1".to_string(), "2".to_string()]; // this list shouldn't affect anything
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            courses: &HashMap::new(),
            credit_overflow: 0.0,
            courses_overflow: 0,
            catalog_replacements: &HashMap::new(),
            common_replacements: &HashMap::new(),
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
        let course_list = vec!["104031".to_string(), "104166".to_string()]; // although 104031 is in the list, it shouldn't be taken because the user modified its type
        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
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
        assert_eq!(
            user.degree_status.course_statuses[8].r#type,
            Some("hova".to_string())
        ); // We considered 104031 as reshima alef so the user didn't complete this course for hova
        assert_eq!(user.degree_status.course_statuses.len(), 9);

        // check sum credits
        assert_eq!(res, 0.0);

        let mut user = create_user();
        user.degree_status.course_statuses[2].r#type = Some("hova".to_string()); // the user modified the type of 114052 to be hova
        user.degree_status.course_statuses[2].modified = true;
        user.degree_status.course_statuses[3].r#type = Some("reshima alef".to_string()); // the user modified the type of 114054 to be reshima alef
        user.degree_status.course_statuses[3].modified = true;
        let bank_name = "hova".to_string();
        let mut course_list = vec!["104031".to_string(), "104166".to_string()];
        // create DegreeStatusHandler so we can run the function get_modified_courses
        let catalog = Catalog {
            ..Default::default()
        };
        let degree_status_handler = DegreeStatusHandler {
            user: &mut user,
            course_banks: Vec::new(),
            catalog,
            courses: HashMap::new(),
            malag_courses: Vec::new(),
            credits_overflow_map: HashMap::new(),
            missing_credits_map: HashMap::new(),
            courses_overflow_map: HashMap::new(),
        };

        course_list.extend(degree_status_handler.get_modified_courses(&bank_name)); // should take only 114052

        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
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

    #[test]
    async fn test_specialization_group() {
        // for debugging
        let mut user = create_user();
        let bank_name = "specialization group".to_string();
        let course_list = vec![
            "104031".to_string(),
            "104166".to_string(),
            "114052".to_string(),
            "1".to_string(),
            "2".to_string(),
            "114054".to_string(),
            "236303".to_string(),
            "236512".to_string(),
            "394645".to_string(),
        ];
        let specialization_groups = SpecializationGroups {
            groups_list: vec![
                SpecializationGroup {
                    // The user completed this group with 114052, 104031
                    name: "math".to_string(),
                    courses_sum: 2,
                    course_list: vec![
                        "114052".to_string(),
                        "104166".to_string(),
                        "1".to_string(),
                        "104031".to_string(),
                    ],
                    mandatory: Some(vec![vec!["104031".to_string(), "104166".to_string()]]), // need to accomplish one of the courses 104031 or 104166 or 1
                },
                SpecializationGroup {
                    // Although the user completed 4 courses from this group and the mandatory courses,
                    // he didn't complete this group because 104031 was taken to "math"
                    name: "physics".to_string(),
                    courses_sum: 4,
                    course_list: vec![
                        "104031".to_string(),
                        "114054".to_string(),
                        "236303".to_string(),
                        "236512".to_string(),
                        "104166".to_string(),
                    ],
                    mandatory: Some(vec![
                        vec!["114054".to_string(), "236303".to_string()],
                        vec!["104166".to_string(), "236512".to_string()],
                    ]),
                },
                SpecializationGroup {
                    // The user didn't complete the mandatory course
                    name: "other".to_string(),
                    courses_sum: 1,
                    course_list: vec![
                        "104031".to_string(),
                        "114054".to_string(),
                        "236303".to_string(),
                        "236512".to_string(),
                        "104166".to_string(),
                        "394645".to_string(),
                    ],
                    mandatory: Some(vec![vec!["104166".to_string()]]),
                },
            ],
            groups_number: 2,
        };
        let handle_bank_rule_processor =
            create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
        let mut completed_groups = Vec::<String>::new();
        let res = handle_bank_rule_processor
            .specialization_group(&specialization_groups, &mut completed_groups);

        // check sum credits
        assert_eq!(res, 19.5);

        // check completed groups
        assert_eq!(completed_groups, vec!["math".to_string()]);

        // check it adds the type and the group name
        assert_eq!(
            user.degree_status.course_statuses[0].r#type,
            Some("specialization group".to_string())
        );
        assert_eq!(
            user.degree_status.course_statuses[0].specialization_group_name,
            Some("math".to_string())
        );

        // check it doesn't add a group name to course which is not chosen for specific group
        assert_eq!(
            user.degree_status.course_statuses[1].specialization_group_name,
            None
        );
    }

    // ------------------------------------------------------------------------------------------------------
    // Test core function in a full flow
    // ------------------------------------------------------------------------------------------------------

    async fn run_calculate_degree_status(file_name: &str, catalog: &str) -> UserDetails {
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
        let contents = std::fs::read_to_string(format!("../docs/{}", file_name))
            .expect("Something went wrong reading the file");

        let course_statuses =
            course::parse_copy_paste_data(&contents).expect("failed to parse courses data");

        let obj_id = bson::oid::ObjectId::from_str(catalog).expect("failed to create oid");
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
        let malag_courses = db::services::get_all_malags(&client)
            .await
            .expect("failed to get all malags")[0]
            .malag_list
            .clone();
        calculate_degree_status(
            catalog,
            course::vec_to_map(vec_courses),
            malag_courses,
            &mut user,
        );
        user
    }

    #[test]
    async fn missing_credits() {
        let user =
            run_calculate_degree_status("pdf_ctrl_c_ctrl_v.txt", "61a102bb04c5400b98e6f401").await;
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
            9.0
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
            0.0
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[4].course_completed,
            0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[5].credit_requirement,
            Some(8.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[5].credit_completed,
            3.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[6].credit_requirement,
            Some(72.5)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[6].credit_completed,
            72.5
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[6].message,
            Some("בוצעו החלפות בין קורסים עם מספר קטן יותר של נקודות, לכן נוצרו 1 נקודות חסרות שעברו הלאה.".to_string())
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[7].credit_requirement,
            Some(7.5)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[7].credit_completed,
            3.5
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[8].credit_requirement,
            Some(2.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[8].credit_completed,
            2.0
        );

        assert_eq!(
            user.degree_status.overflow_msgs[0],
            "בחובה היו 1 נקודות חסרות שנוספו לדרישה של רשימה ב".to_string()
        );
        assert_eq!(
            user.degree_status.overflow_msgs[1],
            "עברו 6 נקודות מבחירת העשרה לבחירה חופשית".to_string()
        );
        assert_eq!(
            user.degree_status.overflow_msgs[2],
            "יש לסטודנט 5.5 נקודות עודפות".to_string()
        );
    }

    #[test]
    async fn overflow_credits() {
        let user =
            run_calculate_degree_status("pdf_ctrl_c_ctrl_v_2.txt", "61a102bb04c5400b98e6f401")
                .await;
        //FOR VIEWING IN JSON FORMAT
        // std::fs::write(
        //     "degree_status.json",
        //     serde_json::to_string_pretty(&user.degree_status).expect("json serialization failed"),
        // )
        // .expect("Unable to write file");

        // check output
        assert_eq!(
            user.degree_status.course_bank_requirements[0].credit_completed,
            1.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[1].credit_completed,
            6.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[2].course_completed,
            0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[3].credit_completed,
            9.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[4].credit_completed,
            0.0
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[4].course_completed,
            0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[5].credit_completed,
            8.0
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[5].message,
            Some("הסטודנט השלים את השרשרת הבאה:\nפיסיקה 2פ'\n".to_string())
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
            5.5
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
            "עברו 1.5 נקודות מחובה לרשימה ב".to_string()
        );
        assert_eq!(
            user.degree_status.overflow_msgs[1],
            "עברו 0.5 נקודות משרשרת מדעית לרשימה ב".to_string()
        );
        assert_eq!(
            user.degree_status.overflow_msgs[2],
            "יש לסטודנט 0 נקודות עודפות".to_string()
        );
    }

    #[test]
    async fn software_engineer_itinerary() {
        let user =
            run_calculate_degree_status("pdf_ctrl_c_ctrl_v_3.txt", "61d84fce5c5e7813e895a27d")
                .await;
        // //FOR VIEWING IN JSON FORMAT
        // std::fs::write(
        //     "degree_status.json",
        //     serde_json::to_string_pretty(&user.degree_status).expect("json serialization failed"),
        // )
        // .expect("Unable to write file");

        assert_eq!(
            user.degree_status.course_bank_requirements[0].credit_completed,
            1.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[1].credit_completed,
            6.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[2].course_completed,
            1
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[3].credit_completed,
            6.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[4].credit_requirement,
            Some(15.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[4].credit_completed,
            9.5
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[5].credit_completed,
            8.0
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[5].message,
            Some("הסטודנט השלים את השרשרת הבאה:\nפיסיקה 2\nפיסיקה 3\n".to_string())
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[6].credit_requirement,
            Some(101.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[6].credit_completed,
            82.5
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[7].credit_requirement,
            Some(14.5)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[7].credit_completed,
            2.0
        );

        assert_eq!(
            user.degree_status.course_bank_requirements[8].credit_requirement,
            Some(4.0)
        );
        assert_eq!(
            user.degree_status.course_bank_requirements[8].credit_completed,
            3.5
        );

        assert_eq!(
            user.degree_status.overflow_msgs[0],
            "עברו 4 נקודות מפרויקט לרשימה א".to_string()
        );
        assert_eq!(
            user.degree_status.overflow_msgs[1],
            "עברו 2 נקודות משרשרת מדעית לרשימה ב".to_string()
        );
        assert_eq!(
            user.degree_status.overflow_msgs[2],
            "עברו 2 נקודות מבחירת העשרה לבחירה חופשית".to_string()
        );
        assert_eq!(
            user.degree_status.overflow_msgs[3],
            "יש לסטודנט 0 נקודות עודפות".to_string()
        );
    }

    // #[test]
    // async fn find_not_exisiting_courses() {
    //     // remove this after we add all courses to the db
    //     dotenv().ok();
    //     let options = mongodb::options::ClientOptions::parse(CONFIG.uri)
    //         .await
    //         .expect("failed to parse URI");

    //     let client = mongodb::Client::with_options(options).unwrap();
    //     // Ping the server to see if you can connect to the cluster
    //     client
    //         .database("admin")
    //         .run_command(bson::doc! {"ping": 1}, None)
    //         .await
    //         .expect("failed to connect to db");
    //     println!("Connected successfully.");
    //     let contents = std::fs::read_to_string(format!("../docs/{}", "pdf_ctrl_c_ctrl_v_4.txt"))
    //         .expect("Something went wrong reading the file");

    //     let course_statuses =
    //         course::parse_copy_paste_data(&contents).expect("failed to parse courses data");

    //     let obj_id = bson::oid::ObjectId::from_str("61d84fce5c5e7813e895a27d").expect("failed to create oid");
    //     let catalog = db::services::get_catalog_by_id(&obj_id, &client)
    //         .await
    //         .expect("failed to get catalog");
    //     let mut user = UserDetails {
    //         catalog: None,
    //         degree_status: DegreeStatus {
    //             course_statuses,
    //             ..Default::default()
    //         },
    //         modified: false,
    //     };
    //     let vec_courses = db::services::get_all_courses(&client)
    //         .await
    //         .expect("failed to get all courses");
    //     let malag_courses = db::services::get_all_malags(&client)
    //         .await
    //         .expect("failed to get all malags")[0]
    //         .malag_list
    //         .clone();

    //     let courses = course::vec_to_map(vec_courses);
    //     for course in catalog.course_to_bank {
    //         if course.1 == "חובה" {
    //             if !courses.contains_key(&course.0) {
    //                 println!("{}\n", course.0);
    //             }
    //         }
    //     }
    // }
}
