use bson::{doc, Document};
use serde::de::{Error as Err, Unexpected, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::borrow::Borrow;
use std::cmp::Ordering;
use std::collections::HashMap;
use std::fmt;
use std::iter::FromIterator;
use std::ops::Deref;

use crate::core::types::Rule;
use crate::db::Resource;
use crate::sap::CourseDetails;

const NON_STANDARD_PREFIXES: [&str; 4] = ["51", "52", "61", "97"];

/// A normalized course identifier.
///
/// The constructor automatically converts 6-digit IDs to the canonical 8-digit
/// format, so all downstream code can assume IDs are always 8-digit.
#[derive(Default, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize)]
#[serde(transparent)]
pub struct CourseId {
    id: String,
}

impl<'de> Deserialize<'de> for CourseId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let raw = String::deserialize(deserializer)?;
        Ok(CourseId::new(raw))
    }
}

impl CourseId {
    pub fn new(raw: impl Into<String>) -> Self {
        let raw: String = raw.into();
        let id = if raw.len() == 6 {
            Self::to_8digit(&raw)
        } else {
            raw
        };
        CourseId { id }
    }

    /// Convert a 6-digit course ID to its canonical 8-digit format.
    /// Standard (most courses):     ABCDEF → 0ABC0DEF
    /// Non-standard (faculties 51, 52, 61, 97): ABCDEF → AB0C0DEF
    fn to_8digit(id: &str) -> String {
        if NON_STANDARD_PREFIXES.iter().any(|p| id.starts_with(p)) {
            format!("{}0{}0{}", &id[..2], &id[2..3], &id[3..])
        } else {
            format!("0{}0{}", &id[..3], &id[3..])
        }
    }
}

impl Deref for CourseId {
    type Target = str;
    fn deref(&self) -> &str {
        &self.id
    }
}

impl fmt::Display for CourseId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.id)
    }
}

impl From<CourseId> for bson::Bson {
    fn from(id: CourseId) -> bson::Bson {
        bson::Bson::String(id.id)
    }
}

impl Borrow<str> for CourseId {
    fn borrow(&self) -> &str {
        &self.id
    }
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Course {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: CourseId,
    pub credit: f32,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<Tag>>, // All tags for the course, for example "english" and "malag"
}

impl Resource for Course {
    fn collection_name() -> &'static str {
        "Courses"
    }
    fn key(&self) -> Document {
        doc! {"_id": self.id.to_string()}
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub enum Tag {
    English,
    Malag,
    Sport,
    SportTeam, // TODO: check if need this
    MedicinePreclinical,
    MedicineClinical,
}

impl From<&CourseDetails> for Course {
    fn from(details: &CourseDetails) -> Self {
        let mut tags = Vec::new();
        if details.is_english {
            tags.push(Tag::English);
        }
        if details.is_sport {
            tags.push(Tag::Sport);
        }
        if details.is_malag {
            tags.push(Tag::Malag);
        }
        Course {
            id: details.id.clone(),
            credit: details.credits,
            name: details.name.clone(),
            tags: if tags.is_empty() { None } else { Some(tags) },
        }
    }
}

impl Course {
    fn is(&self, tag: Tag) -> bool {
        // TODO: change it to "is_some_and()" when become stable
        self.tags.clone().unwrap_or_default().contains(&tag)
    }
    pub fn is_english(&self) -> bool {
        self.is(Tag::English)
    }

    pub fn is_sport(&self) -> bool {
        self.is(Tag::Sport)
    }

    pub fn is_malag(&self) -> bool {
        self.is(Tag::Malag)
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

impl Visitor<'_> for StateStrVisitor {
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
                log::error!("Json deserialize error: {err}");
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

/// Tolerant deserializer for `CourseStatus::semester`.
///
/// The field is, and stays, `Option<String>` — serialization is unchanged, so
/// writes keep emitting either a plain string or `null`, exactly as before.
///
/// On READ we additionally tolerate documents written by other/newer branches
/// that store the semester as a structured object, e.g.
/// `{ "season": "spring", "start_year": 2023 }`. The shared dev/test Mongo
/// contains such documents, and the previous `Option<String>` deserializer
/// rejected them with `invalid type: map, expected a string`, 500-ing the auth
/// extractor (`db.get::<User>`) and turning every auth-gated integration test
/// red on all branches.
///
/// Decision: an object/map (or any non-string, non-null value) deserializes to
/// `None`, NOT to a derived string. The canonical semester string the rest of
/// the code expects is `"{term}_{counter}"` (e.g. `"חורף_1"`, `"אביב_2.5"`),
/// where `counter` is a per-user chronological ordinal computed across ALL of a
/// user's courses (see `build_semester_map` in `core/parser_v2.rs`).
/// `extract_semester` then parses that trailing `counter` as `f32` to order
/// courses for degree computation. A standalone `{season, start_year}` object
/// carries no such counter, so any string we synthesized from it (e.g.
/// `"spring_2023"`) would be parsed as the bogus ordinal `2023.0` and corrupt
/// the ordering. `None` is already a fully-supported state everywhere
/// (`semester.is_none()`), so mapping the object form to `None` is safe: the
/// course is simply treated as having no semester ordering, never a wrong one.
/// We never panic on the map form.
fn deserialize_tolerant_semester<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::IgnoredAny;

    /// Helper enum: try a string first, otherwise consume and discard whatever
    /// is there (object/number/bool/array). `serde(untagged)` makes serde pick
    /// the first variant that matches, so a string yields `Str`, and anything
    /// else falls through to `Other` (which always matches via `IgnoredAny`).
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum TolerantSemester {
        Str(String),
        Other(IgnoredAny),
    }

    // `#[serde(default)]` on the field already maps a missing field to `None`.
    // An explicit `null` is handled by `Option<TolerantSemester>` → `None`.
    let value = Option::<TolerantSemester>::deserialize(deserializer)?;
    Ok(match value {
        Some(TolerantSemester::Str(s)) => Some(s),
        Some(TolerantSemester::Other(_)) | None => None,
    })
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CourseStatus {
    pub course: Course,
    pub state: Option<CourseState>,
    #[serde(default, deserialize_with = "deserialize_tolerant_semester")]
    pub semester: Option<String>,
    pub grade: Option<Grade>,
    pub r#type: Option<String>, // if none, nissan cries
    pub specialization_group_name: Option<String>,
    pub additional_msg: Option<String>,
    pub modified: bool,
    pub times_repeated: usize,
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

    pub fn not_completed(&self) -> bool {
        self.state == Some(CourseState::NotComplete)
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
                    .next_back()
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

    pub fn is_social(&self) -> bool {
        self.course.name.contains("פעילות חברתית")
    }

    pub fn set_msg(&mut self, msg: impl AsRef<str>) -> &mut Self {
        self.additional_msg = Some(msg.as_ref().to_owned());
        self
    }
    pub fn set_specialization_group_name(&mut self, group_name: impl AsRef<str>) {
        self.specialization_group_name = Some(group_name.as_ref().to_owned());
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CourseBank {
    pub name: String, // for example, Hova, Reshima A.
    pub rule: Rule,
    pub credit: Option<f32>,
}

impl CourseBank {
    pub fn replace_course(&mut self, course: CourseId, replacement: CourseId) {
        fn replace_occurrences(
            courses: &mut [CourseId],
            course: &CourseId,
            replacement: &CourseId,
        ) {
            courses.iter_mut().for_each(|course_id| {
                if course_id == course {
                    *course_id = replacement.clone();
                }
            })
        }

        match self.rule {
            Rule::Chains(ref mut chains) => chains.iter_mut().for_each(|chain| {
                replace_occurrences(chain, &course, &replacement);
            }),
            Rule::SpecializationGroups(ref mut specialization_groups) => {
                specialization_groups
                    .groups_list
                    .iter_mut()
                    .for_each(|specialization_group| {
                        replace_occurrences(
                            &mut specialization_group.course_list,
                            &course,
                            &replacement,
                        );
                        if let Some(mandatory) = &mut specialization_group.mandatory {
                            mandatory.iter_mut().for_each(|courses| {
                                replace_occurrences(courses, &course, &replacement)
                            });
                        }
                    });
            }
            _ => {}
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Grade {
    Numeric(u32),
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

impl PartialOrd for Grade {
    fn partial_cmp(&self, other: &Grade) -> Option<Ordering> {
        match (self, other) {
            (Grade::Numeric(g1), Grade::Numeric(g2)) => g1.partial_cmp(g2),
            (Grade::Numeric(_), _) => Some(Ordering::Greater),
            (_, Grade::Numeric(_)) => Some(Ordering::Less),
            (_, _) => Some(Ordering::Equal),
        }
    }
}

struct GradeStrVisitor;

impl Visitor<'_> for GradeStrVisitor {
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
            _ if v.parse::<u32>().is_ok() => Ok(Grade::Numeric(
                v.parse::<u32>().map_err(|e| Err::custom(e.to_string()))?,
            )),
            _ => {
                let err: E = Err::invalid_type(Unexpected::Str(v), &self);
                log::error!("Json deserialize error: {err}");
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
    HashMap::from_iter(vec.clone().iter().map(|course| course.id.clone()).zip(vec))
}

#[cfg(test)]
mod semester_deserialize_tests {
    use super::CourseStatus;
    use serde_json::{json, Value};

    /// A minimal-but-complete `CourseStatus` JSON document whose `semester`
    /// field is set to the given value. Mirrors the shape stored in Mongo.
    fn course_status_json(semester: Value) -> Value {
        json!({
            "course": { "_id": "01040166", "credit": 0.0, "name": "" },
            "state": null,
            "semester": semester,
            "grade": null,
            "type": null,
            "specialization_group_name": null,
            "additional_msg": null,
            "modified": false,
            "times_repeated": 0,
        })
    }

    /// A normal string semester must keep deserializing to the same value
    /// (unchanged behavior for all existing data).
    #[test]
    fn string_semester_is_preserved() {
        let value = course_status_json(json!("חורף_1"));
        let cs: CourseStatus = serde_json::from_value(value).expect("should deserialize");
        assert_eq!(cs.semester.as_deref(), Some("חורף_1"));
    }

    /// A null semester must deserialize to `None`.
    #[test]
    fn null_semester_is_none() {
        let value = course_status_json(Value::Null);
        let cs: CourseStatus = serde_json::from_value(value).expect("should deserialize");
        assert_eq!(cs.semester, None);
    }

    /// A missing semester must deserialize to `None`.
    #[test]
    fn missing_semester_is_none() {
        let value = json!({
            "course": { "_id": "01040166", "credit": 0.0, "name": "" },
            "modified": false,
            "times_repeated": 0,
        });
        let cs: CourseStatus = serde_json::from_value(value).expect("should deserialize");
        assert_eq!(cs.semester, None);
    }

    /// The bug: a structured/object semester written by another branch
    /// (`{ "season": ..., "start_year": ... }`) must NOT fail deserialization.
    /// It is mapped to `None` (see the deserializer doc comment for why this is
    /// the safe choice for degree computation).
    #[test]
    fn object_semester_is_tolerated_as_none() {
        let value = course_status_json(json!({ "season": "spring", "start_year": 2023 }));
        let cs: CourseStatus =
            serde_json::from_value(value).expect("object semester must not error");
        assert_eq!(cs.semester, None);
    }

    /// The same tolerance must hold when reading from BSON (the actual Mongo
    /// path that 500s the auth extractor today).
    #[test]
    fn object_semester_from_bson_is_tolerated_as_none() {
        let doc = bson::doc! {
            "course": { "_id": "01040166", "credit": 0.0_f64, "name": "" },
            "semester": { "season": "spring", "start_year": 2023_i32 },
            "modified": false,
            "times_repeated": 0_i64,
        };
        let cs: CourseStatus =
            bson::deserialize_from_document(doc).expect("object semester from bson must not error");
        assert_eq!(cs.semester, None);
    }
}
