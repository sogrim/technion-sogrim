use std::collections::HashMap;
use rocket::{futures::future::Map, http::Status};
use rocket_db_pools::Connection;
use crate::db::{Db, services::get_catalog};

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct UserDetails {
    pub courses: Vec<CourseStatus>, //from parser
    pub catalog : bson::oid::ObjectId,
    pub degree_status: DegreeStatus,
}

impl UserDetails {
    pub fn find_course_by_number(&self, number: u32) -> Option<CourseStatus>{
        for course in &self.courses {
            if course.course.number == number {
                return Some(course.clone());
            }
        }
        None
    }
}
    
#[derive(Default, Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "id"))]
    pub id : bson::oid::ObjectId,
    pub name: String,
    pub details : Option<UserDetails>,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub enum Rule {
    All, //  כמו חובה פקולטית.
    Accumulate(u8), // לצבור איקס נקודות מתוך הבנק. למשל, רשימה א'
    Chain(Vec<Vec<Course>>), // למשל שרשרת מדעית.
    SpecializationGroups(Vec<SpecializationGroup>),
    Wildcard(bool), // קלף משוגע עבור להתמודד עם   
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct Course {
    pub number : u32,
    pub credit: f32,
    pub name: String,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub enum CourseState{
    Complete,
    NotComplete,
    InProgress,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct CourseStatus {
    pub course: Course,
    pub semester : Option<f32>,
    pub grade : Option<u8>,
}

impl CourseStatus {
    pub fn passed(&self) -> bool {
        match self.grade {
            Some(grade) => grade >= 55,
            None => false,
        }
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct CourseDisplay {
    pub course_status : CourseStatus,
    pub course_state : CourseState,
    pub r#type: Option<String>, // if none, nissan cries 
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
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

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct DegreeStatus {
    pub course_statuses: Vec<CourseDisplay>,
    pub course_bank_requirements: Vec<Requirement>, // 
    pub credit_overflow_msgs: Vec<String>, // זליגות של נקז ואיך טיפלנו בהם
    pub total_credit: f32,   
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct Catalog{
    #[serde(rename(serialize = "_id", deserialize = "id"))]
    pub id : bson::oid::ObjectId,
    pub name: String,
    pub course_banks: Vec<CourseBank>,
    pub course_table: Vec<CourseTableRow>,
    pub credits_overflow_rules: Vec<(String,String)>, // Tuples of (bank_name1, bank_name2) where credits overflow from bank_name1 transfer to bank_name2.
}

impl Catalog {
    fn get_course_list_for_bank(&self, bank_name: &String) -> Vec<u32> {
        let mut course_list_for_bank = Vec::<u32>::new();
        for course in &self.course_table {
            if course.course_banks.contains(bank_name) {
                course_list_for_bank.push(course.number);
            }
        }
        course_list_for_bank
    }
    pub fn calculate_credits_overflow_for_bank(&self, bank_name:&String, credits_overflow:&mut HashMap<String,f32>, credit_overflow_msgs: &mut Vec::<String>) -> f32 {
        let mut sum_credits = 0.0;
        for rule in &self.credits_overflow_rules {
            if &rule.1 == bank_name {
                sum_credits += if credits_overflow.contains_key(&rule.0) {
                    let credits = credits_overflow[&rule.0];
                    if credits > 0.0 {
                        credit_overflow_msgs.push(["עברו ", &credits.to_string(), " נקודות מ-", &rule.0, " ל-", &rule.1].concat());
                    }
                    *credits_overflow.get_mut(&rule.0).unwrap() = 0.0;
                    credits
                }
                else {
                    0_f32
                };
            }
        }
        sum_credits
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct CourseBank{
    pub name: String, // for example, Hova, Rshima A.
    pub rule: Rule,
    pub credit: f32,
    pub messege: String, //
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct SpecializationGroup {
    pub name: String,
    pub credit: f32,
    pub mandatory: Option<(Vec<u32>, Logic)>,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub enum Logic {
    OR,
    AND,
}

#[derive(Default, Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct CourseTableRow {
    pub number: u32,
    pub course_banks: Vec<String> // שמות הבנקים. שימו לב לקבוצת ההתמחות
}

pub fn set_order(course_banks_type: &Vec::<CourseBank>) -> &Vec::<CourseBank> {
    // TODO: implement this function, should order the banks in catalog in the correct calculations order
    course_banks_type
}

// dummy function, need to be implmeneted by Benny
pub async fn get_course(course_id : u32, conn: &Connection<Db>) -> Result<Course, Status> {
    Ok(Course {
        number: 111111,
        credit: 0.0,
        name: String::from("temp"),
    })
}

pub async fn handle_bank_rule_all(bank_name: &String, degree_status: &mut DegreeStatus, course_list: &Vec<u32>,
                                  user: &UserDetails, conn: &Connection<Db>, credit_overflow: f32) -> Result<f32,Status> {
    let mut sum_credits = credit_overflow;
    for course_number in course_list {
        match user.find_course_by_number(*course_number) {
                Some(course) => {
                    degree_status.course_statuses.push(CourseDisplay {
                        course_status : course.clone(),
                        course_state : if course.passed() { CourseState::Complete } else { CourseState::NotComplete },
                        r#type : Some(bank_name.clone()),
                    });
                    if course.passed() {
                        sum_credits += course.course.credit;
                    }
                },
                None => {
                    degree_status.course_statuses.push(CourseDisplay {
                        course_status : CourseStatus {
                            course : get_course(course_number.clone(), conn).await?,
                            semester : None,
                            grade : None,
                        },
                        course_state : CourseState::NotComplete,
                        r#type : Some(bank_name.clone()),
                    });
                },
        }
    }
    Ok(sum_credits)
}

pub fn handle_bank_rule_accumulate(bank_name: &String, degree_status: &mut DegreeStatus, course_list: &Vec<u32>,
                                   user: &UserDetails, credit_overflow: f32) -> f32{
    let mut sum_credits = credit_overflow;
    for course_number in course_list {
        match user.find_course_by_number(*course_number) {
                Some(course) => {
                    degree_status.course_statuses.push(CourseDisplay {
                        course_status : course.clone(),
                        course_state : if course.passed() { CourseState::Complete } else { CourseState::NotComplete },
                        r#type : Some(bank_name.clone()),
                    });
                    if course.passed() {
                        sum_credits += course.course.credit;
                    }
                },
                None => {},
        }
    }
    sum_credits
}

pub async fn calculate_degree_status(user: &UserDetails, conn: &Connection<Db>) -> Result<(),Status> {
    let catalog = get_catalog(user.catalog, conn).await?;
    let course_banks = set_order(&catalog.course_banks);
    let mut degree_status = DegreeStatus {
        course_statuses: Vec::<CourseDisplay>::new(),
        course_bank_requirements: Vec::<Requirement>::new(),
        credit_overflow_msgs: Vec::<String>::new(),
        total_credit: 0.0,
    };
    let mut credits_overflow_map = HashMap::new();
    for bank in course_banks {
        let course_list_for_bank = catalog.get_course_list_for_bank(&bank.name);
        let credits_overflow = catalog.calculate_credits_overflow_for_bank(&bank.name, &mut credits_overflow_map, &mut degree_status.credit_overflow_msgs);
        match &bank.rule {
            Rule::All => {
                let sum_credits = handle_bank_rule_all(&bank.name, &mut degree_status, &course_list_for_bank, &user, &conn, credits_overflow).await?;
                degree_status.course_bank_requirements.push(Requirement {
                    course_bank_name: bank.name.clone(),
                    credit_requirment: bank.credit,
                    credit_complete: match sum_credits {
                        sum_credits if sum_credits <= bank.credit => {
                            degree_status.total_credit += sum_credits;
                            sum_credits
                        }
                        _ => {
                            credits_overflow_map.insert(bank.name.clone(), bank.credit - sum_credits);
                            degree_status.total_credit += bank.credit;
                            bank.credit
                        }
                    },
                    message: None,
                });
            }
            Rule::Accumulate => {
                let sum_credits = handle_bank_rule_accumulate(&bank.name, &mut degree_status, &course_list_for_bank, &user, credits_overflow);
                degree_status.course_bank_requirements.push(Requirement {
                    course_bank_name: bank.name.clone(),
                    credit_requirment: bank.credit,
                    credit_complete: match sum_credits {
                        sum_credits if sum_credits <= bank.credit => {
                            degree_status.total_credit += sum_credits;
                            sum_credits
                        }
                        _ => {
                            credits_overflow_map.insert(bank.name.clone(), bank.credit - sum_credits);
                            degree_status.total_credit += bank.credit;
                            bank.credit
                        }
                    },
                    message: None,
                });
            }
            _ => todo!()
        }
    }

    Ok(())
}