use crate::resources::catalog::OptionalReplacements;
use crate::resources::course::CourseId;
use bson::doc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type Chain = Vec<CourseId>;
pub type NumCourses = u32;

#[derive(Default, PartialEq, Eq, Clone, Debug, Deserialize, Serialize)]
pub struct SpecializationGroup {
    pub name: String,
    pub courses_sum: usize, //Indicates how many courses should the user accomplish in this specialization group
    pub course_list: Vec<CourseId>,

    // The user needs to pass one of the courses in each list. (To support complex requirements)
    // for example:
    // [[1,2],
    //  [3,4],
    //  [5,6]]
    // The user needs to pass the courses: (1 or 2), and (3 or 4), and (5 or 6).
    pub mandatory: Option<Vec<OptionalReplacements>>,
}

#[derive(Default, PartialEq, Eq, Clone, Debug, Deserialize, Serialize)]
pub struct SpecializationGroups {
    pub groups_list: Vec<SpecializationGroup>,
    pub groups_number: usize,
}

#[derive(PartialEq, Eq, Clone, Debug, Deserialize, Serialize)]
pub enum Rule {
    All,              //  כמו חובה פקולטית.
    AccumulateCredit, // לצבור איקס נקודות מתוך הבנק. למשל, רשימה א'
    AccumulateCourses(NumCourses),
    Malag,
    Sport,
    Elective,
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
            Rule::Elective => "elective".into(),
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

pub enum Transfer {
    CreditOverflow,
    MissingCredit,
    CoursesOverflow,
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
pub struct CreditInfo {
    pub sum_credit: f32,
    pub count_courses: u32,
    pub handled_courses: HashMap<CourseId, CourseId>, // A mapping between course in bank course list, to the course which was done by the user (equal unless there was a replacement)
}
