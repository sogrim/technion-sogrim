use std::collections::HashMap;
use rocket::{Request, http::Status, outcome::{IntoOutcome, try_outcome}, request::{self, FromRequest, Outcome}};
use rocket_db_pools::Connection;
use bson::doc;
use serde::{Serialize, Deserialize};
use crate::{db::{self, Db}, user::UserEmail};
type Chain = Vec<u32>;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    pub course_statuses: Vec<CourseStatus>, //from parser
    pub catalog : bson::oid::ObjectId,
    pub degree_status: DegreeStatus,
}

impl UserDetails {
    pub fn find_course_by_number(&self, number: u32) -> Option<CourseStatus>{
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
    type Error = Status;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {

        let conn = match req.guard::<Connection<Db>>().await{
            Outcome::Success(conn) => conn,
            Outcome::Failure(_) => return Outcome::Failure((Status::ServiceUnavailable, Status::ServiceUnavailable)),
            Outcome::Forward(_) => return Outcome::Forward(()),
        };

        let email = try_outcome!(req.cookies()
                            .get_private("email")
                            .map(|cookie| UserEmail(cookie.value().into()))
                            .ok_or(Status::NetworkAuthenticationRequired)
                            .or_forward(())
                        );


        db::services::get_user_by_email(email.0.into(), &conn).await.into_outcome(Status::ServiceUnavailable)
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

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Course {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub number : u32,
    pub credit: f32,
    pub name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum CourseState{
    Complete,
    NotComplete,
    InProgress,
}

impl CourseStatus {
    pub fn passed(&self) -> bool {
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
pub struct CourseStatus{
    pub course: Course,
    pub state: Option<CourseState>,
    pub semester : Option<String>,
    pub grade : Option<Grade>,
    pub r#type : Option<String>, // if none, nissan cries 
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Requirement{
    /*
    בזין הזה יש את כל הבנקים והאם בוצעו או לא בכל קטלוג
    */
    pub course_bank_name: String,
    pub credit_requirment: f32,
    pub credit_complete: f32,
    // TODO planing ...
    pub message: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DegreeStatus {
    pub course_statuses: Vec<CourseStatus>,
    pub course_bank_requirements: Vec<Requirement>, // 
    pub credit_overflow_msgs: Vec<String>, // זליגות של נקז ואיך טיפלנו בהם
    pub total_credit: f32,   
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
    pub fn calculate_credits_overflow_for_bank(&self, bank_name:&str, credit_overflows_map:&mut HashMap<String,f32>, credit_overflow_msgs: &mut Vec::<String>) -> f32 {
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
                } else {
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

pub async fn handle_bank_rule_all(
    user: &mut UserDetails,
    bank_name: &str,
    course_list: &Vec<u32>,
    conn: &Connection<Db>,
    credit_overflow: f32
) -> Result<f32,Status> {
    let mut sum_credits = credit_overflow;
    for course_number in course_list {
        match user.find_course_by_number(*course_number) {
            Some(course_status) => {
                user.degree_status.course_statuses.push(CourseStatus {
                    course: course_status.course.clone(),
                    r#type : Some(bank_name.clone().to_string()),
                    state: if course_status.passed() {
                        sum_credits += course_status.course.credit;
                        Some(CourseState::Complete)
                    } else {
                        Some(CourseState::NotComplete)
                    },
                    semester: course_status.semester.clone(),
                    grade: course_status.grade.clone(),
                });
            },
            None => {
                user.degree_status.course_statuses.push(CourseStatus {
                    course : db::services::get_course_by_id(course_number.clone(), conn).await?,
                    r#type : Some(bank_name.clone().to_string()),
                    state : Some(CourseState::NotComplete),
                    semester : None,
                    grade : None,
                });
            },
        }
    }
    Ok(sum_credits)
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
                user.degree_status.course_statuses.push(CourseStatus {
                    course: course_status.course.clone(),
                    r#type : Some(bank_name.clone().to_string()),
                    state: if course_status.passed() {
                        sum_credits += course_status.course.credit;
                        Some(CourseState::Complete)
                    } else {
                        Some(CourseState::NotComplete)
                    },
                    semester: course_status.semester.clone(),
                    grade: course_status.grade.clone(),
                });
            },
            None => {},
        }
    }
    sum_credits
}

pub fn handle_bank_rule_chain(
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
                user.degree_status.course_statuses.push(CourseStatus {
                    course: course_status.course.clone(),
                    r#type : Some(bank_name.clone().to_string()),
                    state: if course_status.passed() {
                        sum_credits += course_status.course.credit;
                        Some(CourseState::Complete)
                    } else {
                        Some(CourseState::NotComplete)
                    },
                    semester: course_status.semester.clone(),
                    grade: course_status.grade.clone(),
                });
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

pub async fn calculate_degree_status(user: &mut UserDetails, conn: &Connection<Db>) -> Result<(),Status> {
    let catalog = db::services::get_catalog_by_id(user.catalog, conn).await?;
    let course_banks = set_order(&catalog.course_banks);
    user.degree_status = DegreeStatus {
        course_statuses: Vec::<CourseStatus>::new(),
        course_bank_requirements: Vec::<Requirement>::new(),
        credit_overflow_msgs: Vec::<String>::new(),
        total_credit: 0.0,
    };
    let mut credits_overflow_map = HashMap::new();
    for bank in course_banks {
        let course_list_for_bank = catalog.get_course_list_for_bank(&bank.name);
        let credits_overflow = catalog.calculate_credits_overflow_for_bank(&bank.name, &mut credits_overflow_map, &mut user.degree_status.credit_overflow_msgs);
        match &bank.rule {
            Rule::All => {
                let sum_credits = handle_bank_rule_all(user, &bank.name, &course_list_for_bank,  &conn, credits_overflow).await?;
                user.degree_status.course_bank_requirements.push(Requirement {
                    course_bank_name: bank.name.clone(),
                    credit_requirment: bank.credit,
                    credit_complete: if sum_credits <= bank.credit {
                            user.degree_status.total_credit += sum_credits;
                            sum_credits
                        } else {
                            credits_overflow_map.insert(bank.name.clone(), bank.credit - sum_credits);
                            user.degree_status.total_credit += bank.credit;
                            bank.credit
                        },
                    message: None,
                });
            }
            Rule::Accumulate => {
                let sum_credits = handle_bank_rule_accumulate(user, &bank.name, &course_list_for_bank, credits_overflow);
                user.degree_status.course_bank_requirements.push(Requirement {
                    course_bank_name: bank.name.clone(),
                    credit_requirment: bank.credit,
                    credit_complete: if sum_credits <= bank.credit {
                            user.degree_status.total_credit += sum_credits;
                            sum_credits
                        } else {
                            credits_overflow_map.insert(bank.name.clone(), bank.credit - sum_credits);
                            user.degree_status.total_credit += bank.credit;
                            bank.credit
                        },
                    message: None,
                });
            }
            Rule::Chains(chains) => {
                let (sum_credits, completed_chain) = handle_bank_rule_chain(user, &bank.name, &course_list_for_bank, &chains, credits_overflow);
                user.degree_status.course_bank_requirements.push(Requirement {
                    course_bank_name: bank.name.clone(),
                    credit_requirment: bank.credit,
                    credit_complete: if sum_credits <= bank.credit {
                            user.degree_status.total_credit += sum_credits;
                            sum_credits
                        } else {
                            credits_overflow_map.insert(bank.name.clone(), bank.credit - sum_credits);
                            user.degree_status.total_credit += bank.credit;
                            bank.credit
                        },
                    message: if completed_chain {
                        Some(String::from("The user completed a full chain"))
                    } else {
                        Some(String::from("The user didn't complete a full chain"))
                    },
                });
            }
            _ => todo!()
        }
    }

    Ok(())
    
}