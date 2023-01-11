use serde::de::{Error as Err, Unexpected, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;
use std::iter::FromIterator;

use crate::core::types::Rule;
use crate::db::CollectionName;

pub type CourseId = String;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Course {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: CourseId,
    pub credit: f32,
    pub name: String,
}

impl CollectionName for Course {
    fn collection_name() -> &'static str {
        "Courses"
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CourseState {
    Complete,
    NotComplete,
    InProgress,
    Irrelevant,
}

impl Serialize for CourseState {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            CourseState::Complete => serializer.serialize_str("הושלם"),
            CourseState::NotComplete => serializer.serialize_str("לא הושלם"),
            CourseState::InProgress => serializer.serialize_str("בתהליך"),
            CourseState::Irrelevant => serializer.serialize_str("לא רלוונטי"),
        }
    }
}
struct StateStrVisitor;

impl<'de> Visitor<'de> for StateStrVisitor {
    type Value = CourseState;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("a valid string representation of a course state")
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
    where
        E: Err,
    {
        match v {
            "הושלם" => Ok(CourseState::Complete),
            "לא הושלם" => Ok(CourseState::NotComplete),
            "בתהליך" => Ok(CourseState::InProgress),
            "לא רלוונטי" => Ok(CourseState::Irrelevant),
            _ => {
                let err: E = Err::invalid_type(Unexpected::Str(v), &self);
                log::error!("Json deserialize error: {}", err.to_string());
                Err(err)
            }
        }
    }
}

impl<'de> Deserialize<'de> for CourseState {
    fn deserialize<D>(deserializer: D) -> Result<CourseState, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(StateStrVisitor)
    }
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CourseStatus {
    pub course: Course,
    pub state: Option<CourseState>,
    pub semester: Option<String>,
    pub grade: Option<Grade>,
    pub r#type: Option<String>, // if none, nissan cries
    pub specialization_group_name: Option<String>,
    pub additional_msg: Option<String>,
    pub modified: bool,
}

impl CourseStatus {
    pub fn passed(&self) -> bool {
        match &self.grade {
            Some(grade) => match grade {
                Grade::Numeric(grade) => grade >= &55,
                Grade::Binary(val) => *val,
                Grade::ExemptionWithoutCredit => true,
                Grade::ExemptionWithCredit => true,
                Grade::NotComplete => false,
            },
            None => false,
        }
    }

    pub fn completed(&self) -> bool {
        self.state == Some(CourseState::Complete)
    }

    pub fn credit(&self) -> Option<f32> {
        self.completed().then_some(self.course.credit)
    }

    pub fn extract_semester(&self) -> f32 {
        self.semester
            .as_ref()
            .map(|semester| {
                semester
                    .split('_')
                    .last()
                    .unwrap_or("0.0")
                    .parse::<f32>()
                    .unwrap_or(0.0)
            })
            .unwrap_or(0.0)
    }

    pub fn valid_for_bank(&self, bank_name: &str) -> bool {
        if self.state == Some(CourseState::Irrelevant) {
            false
        } else if let Some(r#type) = &self.r#type {
            self.modified && r#type == bank_name
        } else {
            true
        }
    }

    pub fn set_state(&mut self) {
        self.state = self
            .passed()
            .then_some(CourseState::Complete)
            .or(if self.grade.is_none() {
                Some(CourseState::InProgress)
            } else {
                Some(CourseState::NotComplete)
            });
    }
    pub fn set_type(&mut self, r#type: impl AsRef<str>) -> &mut Self {
        self.r#type = Some(r#type.as_ref().to_owned());
        self
    }

    pub fn set_msg(&mut self, msg: impl AsRef<str>) -> &mut Self {
        self.additional_msg = Some(msg.as_ref().to_owned());
        self
    }
    pub fn set_specialization_group_name(&mut self, group_name: impl AsRef<str>) {
        self.specialization_group_name = Some(group_name.as_ref().to_owned());
    }

    pub fn is_sport(&self) -> bool {
        self.course.id.starts_with("394")
    }

    pub fn is_language(&self) -> bool {
        let course_num = self.course.id.parse::<u32>().unwrap_or_default();
        (324600..=324695).contains(&course_num) || (324002..=324068).contains(&course_num)
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CourseBank {
    pub name: String, // for example, Hova, Reshima A.
    pub rule: Rule,
    pub credit: Option<f32>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Malags {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: bson::oid::ObjectId,
    pub malag_list: Vec<CourseId>,
}

impl CollectionName for Malags {
    fn collection_name() -> &'static str {
        "Malags"
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Grade {
    Numeric(u8),
    Binary(bool),
    ExemptionWithoutCredit,
    ExemptionWithCredit,
    NotComplete,
}

impl Serialize for Grade {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match *self {
            Grade::Numeric(grade) => serializer.serialize_str(grade.to_string().as_str()),
            Grade::Binary(val) if val => serializer.serialize_str("עבר"),
            Grade::Binary(_) => serializer.serialize_str("נכשל"),
            Grade::ExemptionWithoutCredit => serializer.serialize_str("פטור ללא ניקוד"),
            Grade::ExemptionWithCredit => serializer.serialize_str("פטור עם ניקוד"),
            Grade::NotComplete => serializer.serialize_str("לא השלים"),
        }
    }
}
struct GradeStrVisitor;

impl<'de> Visitor<'de> for GradeStrVisitor {
    type Value = Grade;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("a valid string representation of a grade")
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
    where
        E: Err,
    {
        match v {
            "עבר" => Ok(Grade::Binary(true)),
            "נכשל" => Ok(Grade::Binary(false)),
            "פטור ללא ניקוד" => Ok(Grade::ExemptionWithoutCredit),
            "פטור עם ניקוד" => Ok(Grade::ExemptionWithCredit),
            "לא השלים" => Ok(Grade::NotComplete),
            _ if v.parse::<u8>().is_ok() => Ok(Grade::Numeric(
                v.parse::<u8>().map_err(|e| Err::custom(e.to_string()))?,
            )),
            _ => {
                let err: E = Err::invalid_type(Unexpected::Str(v), &self);
                log::error!("Json deserialize error: {}", err.to_string());
                Err(err)
            }
        }
    }
}

impl<'de> Deserialize<'de> for Grade {
    fn deserialize<D>(deserializer: D) -> Result<Grade, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(GradeStrVisitor)
    }
}

pub fn vec_to_map(vec: Vec<Course>) -> HashMap<CourseId, Course> {
    HashMap::from_iter(
        vec.clone()
            .iter()
            .map(|course| course.id.clone())
            .zip(vec.into_iter()),
    )
}
