use crate::resources::course::{Course, CourseId};
use crate::resources::{catalog::OptionalReplacements, course::Tag};
use bson::doc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type Chain = Vec<CourseId>;
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
pub enum Predicate {
    InList(Vec<CourseId>),
    HasTag(Tag),
    StartsWith(String),
    Wildcard,
}

pub trait Holds {
    fn holds_on(&self, course: &Course) -> bool;
}

impl Holds for Predicate {
    fn holds_on(&self, course: &Course) -> bool {
        match self {
            Predicate::InList(list) => list.contains(&course.id),
            Predicate::HasTag(tag) => {
                matches!(course.tags.as_ref(), Some(tags) if tags.contains(tag))
            }
            Predicate::StartsWith(prefix) => course.id.starts_with(prefix),
            Predicate::Wildcard => true,
        }
    }
}

impl Holds for Vec<Predicate> {
    fn holds_on(&self, course: &Course) -> bool {
        self.iter().any(|predicate| predicate.holds_on(course))
    }
}

#[derive(PartialEq, Eq, Clone, Debug, Deserialize, Serialize)]
pub enum Rule {
    All(Vec<CourseId>),
    AccumulateCredit(Vec<Predicate>),
    AccumulateCourses((usize, Vec<Predicate>)),
    Malag,
    Sport,
    Elective,
    Chains(Vec<Chain>),
    SpecializationGroups(SpecializationGroups),
    Wildcard(bool),
}

impl ToString for Rule {
    fn to_string(&self) -> String {
        match self {
            Rule::All(_) => "all",
            Rule::AccumulateCredit(_) => "accumulate credit",
            Rule::AccumulateCourses(_) => "accumulate courses",
            Rule::Malag => "malag",
            Rule::Sport => "sport",
            Rule::Elective => "elective",
            Rule::Chains(_) => "chains",
            Rule::SpecializationGroups(_) => "specialization groups",
            Rule::Wildcard(_) => "wildcard",
        }
        .into()
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
