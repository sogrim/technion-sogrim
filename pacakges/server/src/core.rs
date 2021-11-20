use std::collections::HashMap;
use bson::doc;
use serde::{Serialize, Deserialize};
use petgraph::Graph;
use petgraph::algo::toposort;
use crate::catalog::Catalog;
use crate::user::UserDetails;
use crate::course::{Course, CourseState, CourseStatus, CourseBank};

type Chain = Vec<u32>;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Logic {
    OR,
    AND,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Mandatory {
    courses : Vec<u32>,
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
    All, //  כמו חובה פקולטית.
    Accumulate, // לצבור איקס נקודות מתוך הבנק. למשל, רשימה א'
    Malag,
    Sport,
    FreeChoice,
    Chains(Vec<Chain>), // למשל שרשרת מדעית.
    SpecializationGroups(SpecializationGroups),
    Wildcard(bool), // קלף משוגע עבור להתמודד עם   
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Grade{
    Grade(u8),
    Binary(bool),
    ExemptionWithoutCredit,
    ExemptionWithCredit,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CreditOverflow {
    pub from : String,
    pub to : String,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Requirement {
    /*
    בזין הזה יש את כל הבנקים והאם בוצעו או לא בכל קטלוג
    */
    pub course_bank_name: String,
    pub credit_requirment: f32,
    pub credit_complete: f32,
    // TODO planing ...
    pub message: Option<String>,
}

impl Requirement {
    fn create(bank_name: String, credit_requirment: f32) -> Self {
        Requirement {
            course_bank_name: bank_name,
            credit_requirment,
            ..Default::default()
        }
    }
    fn with_credits(mut self, credit_complete: f32) -> Self {
        self.credit_complete = credit_complete;
        self
    }
    fn with_message(mut self, msg: Option<String>) -> Self {
        self.message = msg;
        self
    }
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct DegreeStatus {
    pub course_statuses: Vec<CourseStatus>,
    pub course_bank_requirements: Vec<Requirement>, // 
    pub credit_overflow_msgs: Vec<String>, // זליגות של נקז ואיך טיפלנו בהם
    pub total_credit: f32,   
}

pub fn set_order(course_banks: &Vec<CourseBank>, credit_overflow_rules: &Vec<CreditOverflow>) -> Vec<CourseBank> {
    let mut names_to_indices = HashMap::new();
    let mut indices_to_names = HashMap::new();
    let mut g = Graph::<String, ()>::new();
    for course_bank in course_banks {
        let node_idx = g.add_node(course_bank.name.clone());
        names_to_indices.insert(course_bank.name.clone(), node_idx.clone());
        indices_to_names.insert(node_idx.clone(), course_bank.name.clone());
    }
    for credit_rule in credit_overflow_rules {
        g.add_edge(names_to_indices[&credit_rule.from], names_to_indices[&credit_rule.to], ());
    }
    let order = toposort(&g, None).unwrap();
    let mut ordered_course_banks = Vec::<CourseBank>::new();
    for node in order {
        ordered_course_banks.push(course_banks
            .iter()
            .find(|c|c.name == indices_to_names[&node])
            .unwrap()
            .clone());
    }
    ordered_course_banks
}

pub fn set_type_and_add_credits(course_status: &mut CourseStatus, bank_name: String, sum_credits: &mut f32) {
    if course_status.r#type.is_none() {
        if course_status.passed() {
            *sum_credits += course_status.course.credit;
        }
        course_status.set_type(bank_name);
    }
}

struct BankRuleHandler<'a> {
    user: &'a mut UserDetails,
    bank_name: String,
    course_list: Vec<u32>,
    credit_overflow: f32,
}

impl<'a> BankRuleHandler<'a> {

    fn iterate_course_list(&mut self) -> f32{
        let mut sum_credits = self.credit_overflow;
        for course_number in &self.course_list {
            if let Some(course_status) = self.user.get_mut_course_status(*course_number) {
                set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits);
            }
        }
        sum_credits
    }

    pub fn all(self) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_number in self.course_list {
            match self.user.get_mut_course_status(course_number) {
                Some(course_status) => {
                    set_type_and_add_credits(course_status, self.bank_name.clone(), &mut sum_credits);
                },
                None => {
                    self.user.degree_status.course_statuses.push(CourseStatus {
                        course : Course{
                            number : course_number,
                            ..Default::default()
                        },
                        state : Some(CourseState::NotComplete),
                        r#type : Some(self.bank_name.clone()),
                        ..Default::default()
                    });
                },
            }
        }
        sum_credits
    }
    
    pub fn accumulate(mut self) -> f32 {
        self.iterate_course_list()
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
    
    pub fn chain(mut self, chains: &Vec<Chain>) -> (f32, bool) {
    // TODO: notify the user about courses he has left to complete the chain he started
        let sum_credits = self.iterate_course_list();
        for chain in chains { //check if the user completed one of the chains.
            let mut completed_chain = true;
            for course_number in chain {
                completed_chain &= self.user.passed_course(*course_number);
            }
            if completed_chain {
                return (sum_credits, true);
            }
        }
        (sum_credits, false)
    }
    
    pub fn specialization_group(mut self, specialization_groups: &SpecializationGroups) -> (f32, bool) {
        let sum_credits = self.iterate_course_list();
        let mut count_completed_groups = 0;
        for specialization_group in &specialization_groups.groups_list { //check if the user completed all the specialization groups requirements
            let mut completed_group = true;
            if let Some(mandatory) = &specialization_group.mandatory {
                completed_group = matches!(&mandatory.logic, Logic::AND);
                for course_number in &mandatory.courses {
                    match &mandatory.logic {
                        Logic::OR => { completed_group |= self.user.passed_course(*course_number); }
                        Logic::AND => { completed_group &= self.user.passed_course(*course_number); }
                    }
                }
            }
            let mut count_courses = 0;
            for course_number in &specialization_group.course_list {
                if self.user.passed_course(*course_number) {
                    self.user.degree_status.course_statuses
                        .iter_mut()
                        .find(|c| c.course.number == *course_number)
                        .unwrap()
                        .set_msg(specialization_group.name.clone());
                    count_courses += 1;
                }
            }
            completed_group &= count_courses >= specialization_group.courses_sum;
            if completed_group {
                count_completed_groups += 1;
            }
        }
        (sum_credits, count_completed_groups >= specialization_groups.groups_number)
    }
}



struct DegreeStatusHandler<'a>{
    user : &'a mut UserDetails, 
    course_banks: Vec<CourseBank>,
    catalog: &'a Catalog,
    credit_overflow_map: HashMap<String, f32>,
}

impl<'a> DegreeStatusHandler<'a> {

    fn calculate_credits_overflow_for_bank(&mut self, bank_name: &str) -> f32 {
        let mut sum_credits = 0.0;
        for credit_overflow in &self.catalog.credit_overflows {
            if &credit_overflow.to == bank_name {
                if self.credit_overflow_map.contains_key(&credit_overflow.from) {
                    let credits = self.credit_overflow_map[&credit_overflow.from];
                    if credits > 0.0 {
                        self
                            .user
                            .degree_status
                            .credit_overflow_msgs
                            .push(format!("עברו {} נקודות מ- {} ל- {}", credits, &credit_overflow.from, &credit_overflow.to));
                        *self.credit_overflow_map.get_mut(&credit_overflow.from).unwrap() = 0.0;
                        sum_credits += credits
                    }
                }
            }
        }
        sum_credits
    }

    fn calculate_credit_and_handle_overflow(&mut self, bank: &CourseBank, sum_credits: f32) -> f32 {
        if sum_credits <= bank.credit {
            self.user.degree_status.total_credit += sum_credits;
            sum_credits
        } 
        // The student has credits overflow for this bank
        else {
            self.credit_overflow_map.insert(bank.name.clone(), sum_credits - bank.credit);
            self.user.degree_status.total_credit += bank.credit;
            bank.credit
        }
    }

    fn calculate_credit_leftovers(&mut self) -> f32 {
        let mut sum_credits = 0.0;
        for credit_overflow in &mut self.credit_overflow_map {
            sum_credits += *credit_overflow.1;
        }
        sum_credits
    }

    fn add_requirement(&mut self, bank: &CourseBank, sum_credits: f32, msg: Option<String>) {
        let credit_complete = self.calculate_credit_and_handle_overflow(bank, sum_credits);
        self.user.degree_status.course_bank_requirements.push(
            Requirement::create(bank.name.clone(), bank.credit)
                .with_credits(credit_complete)
                .with_message(msg));
    }

    fn handle_bank_rule(&mut self, bank: &CourseBank, course_list_for_bank: Vec<u32>, credit_overflow: f32){
        let bank_rule_handler = BankRuleHandler {
            user: self.user,
            bank_name: bank.name.clone(),
            course_list: course_list_for_bank,
            credit_overflow
        };
        match &bank.rule {
            Rule::All => {
                let sum_credits = bank_rule_handler.all();
                self.add_requirement(bank, sum_credits, None);   
            }
            Rule::Accumulate => {
                let sum_credits = bank_rule_handler.accumulate();
                self.add_requirement(bank, sum_credits, None); 
            }
            Rule::Malag => {
                let sum_credits = bank_rule_handler.malag();
                self.add_requirement(bank, sum_credits, None); 
            }
            Rule::Sport => {
                let sum_credits = bank_rule_handler.sport();
                self.add_requirement(bank, sum_credits, None); 
            }
            Rule::FreeChoice => {
                let sum_credits = bank_rule_handler.free_choice();
                self.add_requirement(bank, sum_credits, None); 
            }
            Rule::Chains(chains) => {
                let (sum_credits, completed_chain) = bank_rule_handler.chain(chains);
                let msg = if completed_chain {
                    String::from("The user completed a full chain")
                }
                else {
                    String::from("The user didn't complete a full chain")
                };
                self.add_requirement(bank, sum_credits, Some(msg));
            }
            Rule::SpecializationGroups(specialization_groups) => {
                let (sum_credits, completed_groups) = bank_rule_handler.specialization_group(specialization_groups);
                let msg = if completed_groups {
                    String::from("The user completed enough specialization groups")
                }
                else {
                    String::from("The user didn't completed enough specialization groups")
                };
                self.add_requirement(bank, sum_credits, Some(msg));
            }
            _ => todo!()
        }
    }

    fn handle_leftovers(&mut self) {
        for course_status in &self.user.degree_status.course_statuses {
            if course_status.r#type.is_none() && course_status.passed() { //Nissan cries
                self.user.degree_status.total_credit += course_status.course.credit;
            }
        }
    }
    
    pub fn proccess(mut self) {
        for bank in self.course_banks.clone() {
            let course_list_for_bank = self.catalog.get_course_list(&bank.name);
            let credit_overflow = self.calculate_credits_overflow_for_bank(&bank.name);
            self.handle_bank_rule(&bank, course_list_for_bank, credit_overflow);
        }
        let credit_leftovers = self.calculate_credit_leftovers(); // if different from 0 then the user has extra credits he doesn't use
        self.user.degree_status.total_credit += credit_leftovers;
        self
            .user
            .degree_status
            .credit_overflow_msgs
            .push(format!("יש לסטודנט {} נקודות עודפות", credit_leftovers));
        self.handle_leftovers(); // Need to consult with Nissan and Benny
    }
}

pub fn calculate_degree_status(catalog: &Catalog, user: &mut UserDetails) {
    let course_banks = set_order(&catalog.course_banks, &catalog.credit_overflows);
    
    DegreeStatusHandler{      
        user,
        course_banks,
        catalog,
        credit_overflow_map: HashMap::new(),
    }.proccess();
}


#[cfg(test)]
mod tests{
    use std::str::FromStr;

    use dotenv::dotenv;
    use actix_rt::test;
    use crate::{course::{self}, db};   
    use super::*;

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
                            name: "פיסיקה2".to_string(),
                        },
                        state: Some(CourseState::Complete),
                        grade: Some(Grade::Grade(85)),
                        ..Default::default()
                    },
                    CourseStatus {
                        course: Course {
                            number: 114054,
                            credit: 3.5,
                            name: "פיסקה3".to_string(),
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
                    }
                ],
                course_bank_requirements: Vec::<Requirement>::new(),
                credit_overflow_msgs: Vec::<String>::new(),
                total_credit: 0.0,
            },
            modified: false,
        }
    }
    
    #[test]
    async fn test_rule_all() { // for debugging
        let mut user = create_user();
        let bank_name = "hova".to_string();
        let course_list = vec![000001, 000002, 123456, 456789, 159159, 000003];
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            credit_overflow
        };
        let res = handle_bank_rule_processor.all();
        // check it adds the type
        assert_eq!(user.degree_status.course_statuses[0].r#type, Some("hova".to_string()));
        assert_eq!(user.degree_status.course_statuses[1].r#type, Some("hova".to_string()));
        assert_eq!(user.degree_status.course_statuses[2].r#type, Some("hova".to_string()));
    
        // check it adds the not completed courses in the hove bank
        assert_eq!(user.degree_status.course_statuses[6].course.number, 123456);
        assert!(matches!(user.degree_status.course_statuses[6].state, Some(CourseState::NotComplete)));
    
        assert_eq!(user.degree_status.course_statuses[7].course.number, 456789);
        assert!(matches!(user.degree_status.course_statuses[7].state, Some(CourseState::NotComplete)));
    
        assert_eq!(user.degree_status.course_statuses[8].course.number, 159159);
        assert!(matches!(user.degree_status.course_statuses[8].state, Some(CourseState::NotComplete)));
    
        // check sum credits
        assert_eq!(res, 7.0);
    }

    #[test]
    async fn test_rule_accumulate() { // for debugging
        let mut user = create_user();
        let bank_name = "reshima a".to_string();
        let course_list = vec![000001, 000002, 123456, 456789, 159159, 000003];
        let credit_overflow = 0.0;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            credit_overflow
        };
        let res = handle_bank_rule_processor.accumulate();
        // check it adds the type
        assert_eq!(user.degree_status.course_statuses[0].r#type, Some("reshima a".to_string()));
        assert_eq!(user.degree_status.course_statuses[1].r#type, Some("reshima a".to_string()));
        assert_eq!(user.degree_status.course_statuses[2].r#type, Some("reshima a".to_string()));
        assert_eq!(user.degree_status.course_statuses[3].r#type, None);
        assert_eq!(user.degree_status.course_statuses.len(), 6);
    
        // check sum credits
        assert_eq!(res, 7.0);
    }
    
    #[test]
    async fn test_rule_malag() { // for debugging
        let mut user = create_user();
        let bank_name = "MALAG".to_string();
        let course_list = vec![000001, 000002]; // this list shouldn't affect anything
        let credit_overflow = 2.5;
        let handle_bank_rule_processor = BankRuleHandler {
            user: &mut user,
            bank_name,
            course_list,
            credit_overflow
        };
        let res = handle_bank_rule_processor.malag();
        println!("{}", res);
        println!("{:#?}", user.degree_status);
        // check it adds the type
        assert_eq!(user.degree_status.course_statuses[0].r#type, None);
        assert_eq!(user.degree_status.course_statuses[1].r#type, None);
        assert_eq!(user.degree_status.course_statuses[2].r#type, None);
        assert_eq!(user.degree_status.course_statuses[3].r#type, None);
        assert_eq!(user.degree_status.course_statuses[4].r#type, Some("MALAG".to_string()));
        assert_eq!(user.degree_status.course_statuses.len(), 6);
    
        // check sum credits
        assert_eq!(res, 4.5);
    }

    #[test]
    async fn test_legendary_function() {
        
        dotenv().ok();
        let options = mongodb::options::ClientOptions::parse(
            std::env::var("URI").unwrap())
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
        let contents = std::fs::read_to_string("ug_ctrl_c_ctrl_v.txt")
            .expect("Something went wrong reading the file");

        let course_statuses = course::parse_copy_paste_from_ug(&contents);

        let obj_id = bson::oid::ObjectId::from_str("6199043f1cf3261f8d15aa47").expect("failed to create oid");
        let catalog = db::services::get_catalog_by_id(&obj_id, &client).await.expect("failed to get catalog");
        let mut user = UserDetails {
            catalog: None,
            degree_status: DegreeStatus {
                course_statuses,
                ..Default::default()
            },
            modified: false  
        };
        calculate_degree_status(&catalog, &mut user);
        std::fs::write(
            "degree_status.json", 
        serde_json::to_string_pretty(&user.degree_status)
            .expect("json serialization failed")
        ).expect("Unable to write file");
        println!("{:#?}", user.degree_status);
    }
}

