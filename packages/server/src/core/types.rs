use crate::resources::catalog::OptionalReplacements;
use crate::resources::course::CourseId;
use bson::doc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;

pub type Chain = Vec<CourseId>;
pub type NumCourses = usize;

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

impl fmt::Display for Rule {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let name = match self {
            Rule::All => "all",
            Rule::AccumulateCredit => "accumulate credit",
            Rule::AccumulateCourses(_) => "accumulate courses",
            Rule::Malag => "malag",
            Rule::Sport => "sport",
            Rule::Elective => "elective",
            Rule::Chains(_) => "chains",
            Rule::SpecializationGroups(_) => "specialization groups",
            Rule::Wildcard(_) => "wildcard",
        };
        write!(f, "{name}")
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
    pub course_bank_name: String,
    pub bank_rule_name: String,
    pub credit_requirement: Option<f32>,
    pub course_requirement: Option<usize>,
    pub credit_completed: f32,
    pub course_completed: usize,
    pub completed: bool, //Did the user complete the necessary demands for this bank
    pub message: Option<String>,
}
impl Requirement {
    pub fn credit_requirement(&mut self, credit: f32) -> &mut Self {
        self.credit_requirement = Some(credit);
        self
    }
    pub fn course_requirement(&mut self, course: usize) -> &mut Self {
        self.course_requirement = Some(course);
        self
    }
    pub fn credit_completed(&mut self, credit: f32) -> &mut Self {
        self.credit_completed = credit;
        self
    }
    pub fn course_completed(&mut self, course: usize) -> &mut Self {
        self.course_completed = course;
        self
    }
    pub fn completed(&mut self, completed: bool) -> &mut Self {
        self.completed = completed;
        self
    }
    pub fn message(&mut self, message: String) -> &mut Self {
        self.message = Some(message);
        self
    }
}
pub struct CreditInfo {
    pub sum_credit: f32,
    pub count_courses: usize,
    pub handled_courses: HashMap<CourseId, CourseId>, // A mapping between course in bank course list, to the course which was done by the user (equal unless there was a replacement)
}
