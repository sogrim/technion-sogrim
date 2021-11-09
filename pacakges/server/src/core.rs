use std::collections::HashMap;
use rocket::{Request, http::Status, outcome::{IntoOutcome, try_outcome}, request::{self, FromRequest}};
use rocket_db_pools::Connection;
use bson::doc;
use serde::{Serialize, Deserialize};
use crate::{db::{self, Db}, user::UserEmail};
type Chain = Vec<u32>;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    pub course_statuses: Vec<CourseStatus>, //from parser
    pub catalog : Option<bson::oid::ObjectId>,
    pub degree_status: DegreeStatus,
}

impl UserDetails {
    fn find_course_by_number(&self, number: u32) -> Option<CourseStatus>{
        for course_status in &self.course_statuses {
            if course_status.course.number == number {
                return Some(course_status.clone());
            }
        }
        None
    }
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id : bson::oid::ObjectId,
    pub email: String,
    pub details : Option<UserDetails>,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = String;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {

        let conn = try_outcome!(
            req.guard::<Connection<Db>>()
            .await
            .map_failure(|_| (Status::ServiceUnavailable, "Can't connect to database".into()))
        );

        let email = try_outcome!(req.guard::<UserEmail>().await);

        db::services::get_user_by_email(email.0.as_str(), &conn)
            .await
            .map_err(|err| err.to_string())
            .into_outcome(Status::ServiceUnavailable)
    }
}
    

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Rule {
    All, //  כמו חובה פקולטית.
    Accumulate, // לצבור איקס נקודות מתוך הבנק. למשל, רשימה א'
    Chains(Vec<Chain>), // למשל שרשרת מדעית.
    SpecializationGroups(Vec<SpecializationGroup>),
    Wildcard(bool), // קלף משוגע עבור להתמודד עם   
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Course {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub number : u32,
    pub credit: f32,
    pub name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum CourseState {
    Complete,
    NotComplete,
    InProgress,
}

impl CourseStatus {
    fn passed(&self) -> bool {
        match &self.grade {
            Some(grade) => {
                match grade{
                    Grade::Grade(grade) => grade >= &55,
                    Grade::Binary(val) => *val,
                    Grade::ExemptionWithoutCredit => true,
                    Grade::ExemptionWithCredit => true,
                } 
            },
            None => false,
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Grade{
    Grade(u8),
    Binary(bool),
    ExemptionWithoutCredit,
    ExemptionWithCredit,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CourseStatus {
    pub course: Course,
    pub state: Option<CourseState>,
    pub semester : Option<String>,
    pub grade : Option<Grade>,
    pub r#type : Option<String>, // if none, nissan cries 
}

#[derive(Clone, Debug, Deserialize, Serialize)]
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
    fn create(bank_name: String, credit_requirment: f32) -> Requirement {
        Requirement {
            course_bank_name: bank_name,
            credit_requirment,
            credit_complete: 0.0,
            message: None,
        }
    }
    fn with_credits(mut self, credit_complete: f32) -> Requirement {
        self.credit_complete = credit_complete;
        self
    }
    fn with_message(mut self, msg: String) -> Requirement {
        self.message = Some(msg);
        self
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DegreeStatus {
    pub course_statuses: Vec<CourseStatus>,
    pub course_bank_requirements: Vec<Requirement>, // 
    pub credit_overflow_msgs: Vec<String>, // זליגות של נקז ואיך טיפלנו בהם
    pub total_credit: f32,   
}

impl DegreeStatus {
    fn check_if_course_in_degree_status(&self, number: u32) -> bool {
        for course_status in &self.course_statuses {
            if course_status.course.number == number {
                return true;
            }
        }
        false
    }

    // Adds course to degree status if the course wasn't already added, Otherwise does nothing.
    fn add_course_to_degree_status(&mut self, course_status: CourseStatus, bank_name: String, sum_credits: &mut f32) {
        if self.check_if_course_in_degree_status(course_status.course.number) { return }
        self.course_statuses.push(CourseStatus {
            course: course_status.course.clone(),
            r#type : Some(bank_name),
            state: if course_status.passed() {
                *sum_credits += course_status.course.credit;
                Some(CourseState::Complete)
            }
            else {
                Some(CourseState::NotComplete)
            },
            semester: course_status.semester,
            grade: course_status.grade,
        });
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CreditOverflow {
    pub from : String,
    pub to : String,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Catalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id : bson::oid::ObjectId,
    pub name: String,
    pub course_banks: Vec<CourseBank>,
    pub course_table: Vec<CourseTableRow>,
    pub credit_overflows: Vec<CreditOverflow>,
}

impl Catalog {
    fn get_course_list_for_bank(&self, bank_name: &str) -> Vec<u32> {
        let mut course_list_for_bank = Vec::<u32>::new();
        for course in &self.course_table {
            if course.course_banks.contains(&bank_name.to_string()) {
                course_list_for_bank.push(course.number);
            }
        }
        course_list_for_bank
    }
    fn calculate_credits_overflow_for_bank(&self, bank_name:&str, credit_overflows_map:&mut HashMap<String,f32>, credit_overflow_msgs: &mut Vec::<String>) -> f32 {
        let mut sum_credits = 0.0;
        for credit_overflow in &self.credit_overflows {
            if &credit_overflow.to == bank_name {
                sum_credits += if credit_overflows_map.contains_key(&credit_overflow.from) {
                    let credits = credit_overflows_map[&credit_overflow.from];
                    if credits > 0.0 {
                        credit_overflow_msgs.push(format!("עברו {} נקודות מ- {} ל- {}", credits, &credit_overflow.from, &credit_overflow.to));
                    }
                    *credit_overflows_map.get_mut(&credit_overflow.from).unwrap() = 0.0;
                    credits
                }
                else {
                    0.0
                };
            }
        }
        sum_credits
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CourseBank {
    pub name: String, // for example, Hova, Rshima A.
    pub rule: Rule,
    pub credit: f32,
    pub messege: String, //
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SpecializationGroup {
    pub name: String,
    pub credit: f32,
    pub mandatory: Option<(Vec<u32>, Logic)>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum Logic {
    OR,
    AND,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CourseTableRow {
    pub number: u32,
    pub course_banks: Vec<String> // שמות הבנקים. שימו לב לקבוצת ההתמחות
}

pub fn set_order(course_banks_type: &Vec::<CourseBank>) -> &Vec::<CourseBank> {
    // TODO: implement this function, should order the banks in catalog in the correct calculations order
    course_banks_type
}

pub fn calculate_credit_complete_and_handle_overflow(
    bank: &CourseBank,
    sum_credits: f32,
    total_credits: &mut f32,
    credits_overflow_map: &mut HashMap<String, f32>
) -> f32 {
    // The student doesn't have more credits than necessary for this bank
    if sum_credits <= bank.credit {
        *total_credits += sum_credits;
        sum_credits
    } 
    // The student has credits overflow for this bank
    else {
        credits_overflow_map.insert(bank.name.clone(), bank.credit - sum_credits);
        *total_credits += bank.credit;
        bank.credit
    }
}

pub fn handle_bank_rule_all(
    user: &mut UserDetails,
    bank_name: &str,
    course_list: &Vec<u32>,
    credit_overflow: f32
) -> f32 {
    let mut sum_credits = credit_overflow;
    for course_number in course_list {
        match user.find_course_by_number(*course_number) {
            Some(course_status) => {
                user.degree_status.add_course_to_degree_status(course_status.clone(), bank_name.to_string().clone(), &mut sum_credits);
            },
            None => {
                user.degree_status.course_statuses.push(CourseStatus {
                    course : Course{
                        number : course_number.clone(),
                        ..Default::default()
                    },
                    r#type : Some(bank_name.clone().to_string()),
                    state : Some(CourseState::NotComplete),
                    semester : None,
                    grade : None,
                });
            },
        }
    }
    sum_credits
}

pub fn handle_bank_rule_accumulate(
    user: &mut UserDetails,
    bank_name: &str,
    course_list: &Vec<u32>,
    credit_overflow: f32
) -> f32 {
    let mut sum_credits = credit_overflow;
    for course_number in course_list {
        match user.find_course_by_number(*course_number) {
            Some(course_status) => {
                user.degree_status.add_course_to_degree_status(course_status.clone(), bank_name.to_string().clone(), &mut sum_credits);
            },
            None => {},
        }
    }
    sum_credits
}

pub fn handle_bank_rule_chain( // TODO: notify the user about courses he has left to complete the chain he started
    user: &mut UserDetails, 
    bank_name: &str,
    course_list: &Vec<u32>,
    chains: &Vec<Chain>,
    credit_overflow: f32
) -> (f32, bool) {
    let mut sum_credits = credit_overflow;
    for course_number in course_list {
        match user.find_course_by_number(*course_number) {
            Some(course_status) => {
                user.degree_status.add_course_to_degree_status(course_status.clone(), bank_name.to_string().clone(), &mut sum_credits);
            },
            None => {},
        }
    }
    for chain in chains { //check if the user completed one of the chains.
        let mut completed_chain = true;
        for course_number in chain {
            let course = user.find_course_by_number(*course_number);
            completed_chain = course.is_some() && course.unwrap().passed();
        }
        if completed_chain {
            return (sum_credits, true);
        }
    }
    (sum_credits, false)
}

pub fn calculate_degree_status(catalog: &Catalog, user: &mut UserDetails) {
    let course_banks = set_order(&catalog.course_banks);
    user.degree_status = DegreeStatus {
        course_statuses: Vec::<CourseStatus>::new(),
        course_bank_requirements: Vec::<Requirement>::new(),
        credit_overflow_msgs: Vec::<String>::new(),
        total_credit: 0.0,
    };
    let mut credits_overflow_map = HashMap::new(); // Saves credits overflow for each bank
    for bank in course_banks {
        let course_list_for_bank = catalog.get_course_list_for_bank(&bank.name);
        let credits_overflow = catalog.calculate_credits_overflow_for_bank(&bank.name, &mut credits_overflow_map, &mut user.degree_status.credit_overflow_msgs);
        match &bank.rule {
            Rule::All => {
                let sum_credits = handle_bank_rule_all(user, &bank.name, &course_list_for_bank, credits_overflow);
                let credit_complete = calculate_credit_complete_and_handle_overflow(bank, sum_credits, &mut user.degree_status.total_credit, &mut credits_overflow_map);
                user.degree_status.course_bank_requirements.push(
                    Requirement::create(bank.name.clone(), bank.credit)
                    .with_credits(credit_complete));
                    
            }
            Rule::Accumulate => {
                let sum_credits = handle_bank_rule_accumulate(user, &bank.name, &course_list_for_bank, credits_overflow);
                let credit_complete = calculate_credit_complete_and_handle_overflow(bank, sum_credits, &mut user.degree_status.total_credit, &mut credits_overflow_map);
                user.degree_status.course_bank_requirements.push(
                    Requirement::create(bank.name.clone(), bank.credit)
                    .with_credits(credit_complete));
            }
            Rule::Chains(chains) => {
                let (sum_credits, completed_chain) = handle_bank_rule_chain(user, &bank.name, &course_list_for_bank, &chains, credits_overflow);
                let credit_complete = calculate_credit_complete_and_handle_overflow(bank, sum_credits, &mut user.degree_status.total_credit, &mut credits_overflow_map);
                let msg = if completed_chain {
                    String::from("The user completed a full chain")
                }
                else {
                    String::from("The user didn't complete a full chain")
                };
                user.degree_status.course_bank_requirements.push(
                    Requirement::create(bank.name.clone(), bank.credit)
                    .with_credits(credit_complete)
                    .with_message(msg));
            }
            _ => todo!()
        }
    }

    
}

#[cfg(test)]
#[test]
fn check_rules() { // for debugging
    let mut user = UserDetails {
        course_statuses: vec![
            CourseStatus {
                course: Course {
                    number: 000001,
                    credit: 3.0,
                    name: "c1".to_string(),
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Grade(85)),
                semester: None,
                r#type: None,
            },
            CourseStatus {
                course: Course {
                    number: 000002,
                    credit: 3.5,
                    name: "c2".to_string(),
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Grade(45)),
                semester: None,
                r#type: None,
            },                CourseStatus {
                course: Course {
                    number: 000003,
                    credit: 4.0,
                    name: "c3".to_string(),
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Grade(85)),
                semester: None,
                r#type: None,
            },                CourseStatus {
                course: Course {
                    number: 000004,
                    credit: 5.0,
                    name: "c4".to_string(),
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Grade(85)),
                semester: None,
                r#type: None,
            },
        ],
        catalog: None,
        degree_status: DegreeStatus {
            course_statuses: Vec::<CourseStatus>::new(),
            course_bank_requirements: Vec::<Requirement>::new(),
            credit_overflow_msgs: Vec::<String>::new(),
            total_credit: 0.0,
        },
    };
    let bank_name = "hova".to_string();
    let course_list = vec![000001, 000002, 123456, 456789, 159159, 000003];
    let credit_overflow = 0.0;

    let res = handle_bank_rule_all(&mut user, &bank_name, &course_list, credit_overflow);
    println!("{}", res);
    assert_eq!(res, 7.0);
}