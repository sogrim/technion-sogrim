use bson::{doc, Document};
use chrono::Datelike;
use serde::de::{Error as Err, Unexpected, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::borrow::Borrow;
use std::cmp::Ordering;
use std::collections::HashMap;
use std::fmt;
use std::hash::{Hash, Hasher};
use std::iter::FromIterator;
use std::ops::Deref;
use std::str::FromStr;

use crate::core::types::Rule;
use crate::db::Resource;
use crate::sap::CourseDetails;

const NON_STANDARD_PREFIXES: [&str; 4] = ["51", "52", "61", "97"];

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SemesterSeason {
    Winter,
    Spring,
    Summer,
}

impl SemesterSeason {
    pub fn order(self) -> i32 {
        match self {
            SemesterSeason::Winter => 0,
            SemesterSeason::Spring => 1,
            SemesterSeason::Summer => 2,
        }
    }
}

impl FromStr for SemesterSeason {
    type Err = ();

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "חורף" | "winter" | "Winter" => Ok(SemesterSeason::Winter),
            "אביב" | "spring" | "Spring" => Ok(SemesterSeason::Spring),
            "קיץ" | "summer" | "Summer" => Ok(SemesterSeason::Summer),
            _ => Err(()),
        }
    }
}

#[derive(Clone, Debug, Eq, Serialize)]
pub struct AcademicSemester {
    pub season: SemesterSeason,
    pub start_year: i32,
    #[serde(skip)]
    legacy_name: Option<String>,
}

#[derive(Deserialize)]
#[serde(untagged)]
enum AcademicSemesterRepr {
    Object {
        season: SemesterSeason,
        start_year: i32,
    },
    Legacy(String),
}

impl<'de> Deserialize<'de> for AcademicSemester {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        match AcademicSemesterRepr::deserialize(deserializer)? {
            AcademicSemesterRepr::Object { season, start_year } => {
                Ok(AcademicSemester::new(season, start_year))
            }
            AcademicSemesterRepr::Legacy(value) => AcademicSemester::from_legacy_str(&value)
                .map(|semester| semester.with_legacy_name(value))
                .ok_or_else(|| D::Error::custom("invalid legacy semester string")),
        }
    }
}

impl PartialEq for AcademicSemester {
    fn eq(&self, other: &Self) -> bool {
        self.season == other.season && self.start_year == other.start_year
    }
}

impl Hash for AcademicSemester {
    // Hashes only the calendar identity so the Hash/Eq contract holds even when
    // a transient `legacy_name` is attached after deserialization.
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.season.hash(state);
        self.start_year.hash(state);
    }
}

impl Default for AcademicSemester {
    fn default() -> Self {
        AcademicSemester::current()
    }
}

impl AcademicSemester {
    pub fn new(season: SemesterSeason, start_year: i32) -> Self {
        Self {
            season,
            start_year,
            legacy_name: None,
        }
    }

    /// Returns the current academic semester based on the system clock.
    /// The academic year starts in October (winter).
    pub fn current() -> Self {
        let now = chrono::Utc::now();
        let year = now.year();
        match now.month() {
            10..=12 => AcademicSemester::new(SemesterSeason::Winter, year),
            1..=2 => AcademicSemester::new(SemesterSeason::Winter, year - 1),
            3..=7 => AcademicSemester::new(SemesterSeason::Spring, year - 1),
            _ => AcademicSemester::new(SemesterSeason::Summer, year - 1),
        }
    }

    pub fn order_key(&self) -> i32 {
        // Year takes precedence over season by multiplying by 3 (seasons per academic year).
        self.start_year * 3 + self.season.order()
    }

    /// Returns the academic semester immediately preceding this one in calendar order.
    pub fn previous(&self) -> Self {
        match self.season {
            SemesterSeason::Winter => {
                AcademicSemester::new(SemesterSeason::Summer, self.start_year - 1)
            }
            SemesterSeason::Spring => {
                AcademicSemester::new(SemesterSeason::Winter, self.start_year)
            }
            SemesterSeason::Summer => {
                AcademicSemester::new(SemesterSeason::Spring, self.start_year)
            }
        }
    }

    pub fn legacy_name(&self) -> Option<&str> {
        self.legacy_name.as_deref()
    }

    fn with_legacy_name(mut self, legacy_name: String) -> Self {
        self.legacy_name = Some(legacy_name);
        self
    }

    /// Attaches a legacy ordinal name (e.g. "חורף_3") to a freshly-constructed
    /// `AcademicSemester` so it participates in the same legacy-resolution pass
    /// that runs on user-document load. The placeholder `start_year` is replaced
    /// once `resolve_legacy_names` sees the full sequence.
    pub fn with_legacy_marker(season: SemesterSeason, legacy_name: String) -> Self {
        AcademicSemester::new(season, AcademicSemester::current().start_year)
            .with_legacy_name(legacy_name)
    }

    pub fn from_legacy_str(value: &str) -> Option<Self> {
        // Only the calendar identity (season + placeholder year) is set here; the
        // real start_year is filled in by `resolve_legacy_names` once the full
        // ordinal sequence is known.
        let (season, _) = Self::parse_legacy_ordinal(value)?;
        Some(AcademicSemester::new(
            season,
            AcademicSemester::current().start_year,
        ))
    }

    pub fn parse_legacy_ordinal(value: &str) -> Option<(SemesterSeason, f32)> {
        let (season_str, rest) = value.split_once('_')?;
        let season = season_str.parse().ok()?;
        let ordinal = rest.parse::<f32>().ok()?;
        Some((season, ordinal))
    }

    /// Maps a set of legacy ordinal semester names (e.g. "חורף_3", "קיץ_4.5") to
    /// `AcademicSemester` values with concrete calendar years. The latest ordinal is
    /// anchored to the current academic semester (or one year earlier if that would
    /// land in the future), and earlier ordinals are walked backwards through the
    /// calendar — honoring each ordinal's season.
    ///
    /// Names that don't parse as legacy ordinals are silently skipped.
    pub fn resolve_legacy_names(legacy_names: &[String]) -> HashMap<String, AcademicSemester> {
        let mut seen = std::collections::HashSet::new();
        let mut parsed: Vec<(String, SemesterSeason, f32)> = legacy_names
            .iter()
            .filter(|name| seen.insert((*name).clone()))
            .filter_map(|name| {
                Self::parse_legacy_ordinal(name)
                    .map(|(season, ordinal)| (name.clone(), season, ordinal))
            })
            .collect();
        parsed.sort_by(|a, b| a.2.partial_cmp(&b.2).unwrap_or(Ordering::Equal));

        let mut map = HashMap::new();
        let Some((_, last_season, _)) = parsed.last() else {
            return map;
        };

        let now = AcademicSemester::current();
        let mut cursor = AcademicSemester::new(*last_season, now.start_year);
        if cursor.order_key() > now.order_key() {
            cursor = AcademicSemester::new(*last_season, now.start_year - 1);
        }

        // Walk backwards: place the newest ordinal at the anchor, then for each
        // earlier ordinal step the cursor back until it matches that ordinal's season.
        for (name, season, _) in parsed.into_iter().rev() {
            while cursor.season != season {
                cursor = cursor.previous();
            }
            map.insert(name, cursor.clone());
            cursor = cursor.previous();
        }
        map
    }
}

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

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CourseStatus {
    pub course: Course,
    pub state: Option<CourseState>,
    pub semester: Option<AcademicSemester>,
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

    pub fn semester_order_key(&self) -> i32 {
        self.semester
            .as_ref()
            .map(AcademicSemester::order_key)
            .unwrap_or(0)
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
