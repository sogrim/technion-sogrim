use crate::core::*;
use actix_web::error::ErrorInternalServerError;
use actix_web::{error::ErrorBadRequest, Error};
use serde::de::{Error as Err, Unexpected, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;
use std::iter::FromIterator;

pub type CourseId = String;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Course {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: CourseId,
    pub credit: f32,
    pub name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum CourseState {
    Complete,
    NotComplete,
    InProgress,
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
                Grade::Grade(grade) => grade >= &55,
                Grade::Binary(val) => *val,
                Grade::ExemptionWithoutCredit => true,
                Grade::ExemptionWithCredit => true,
                Grade::NotComplete => false,
            },
            None => false,
        }
    }

    pub fn extract_semester(&self) -> f32 {
        match self.semester.clone() {
            Some(semester) => {
                let semester: Vec<&str> = semester.split('_').collect();
                semester.last().unwrap().parse::<f32>().unwrap()
            }
            None => 0.0,
        }
    }

    pub fn valid_for_bank(&self, bank_name: &str) -> bool {
        self.r#type.is_none() || (self.modified && self.r#type.clone().unwrap() == bank_name)
    }

    pub fn set_state(&mut self) {
        self.state = self
            .passed()
            .then(|| CourseState::Complete)
            .or(Some(CourseState::NotComplete));
    }
    pub fn set_type(&mut self, r#type: String) -> &mut Self {
        self.r#type = Some(r#type);
        self
    }
    pub fn set_msg(&mut self, msg: String) -> &mut Self {
        self.additional_msg = Some(msg);
        self
    }
    pub fn set_specialization_group_name(&mut self, group_name: &str) {
        self.specialization_group_name = Some(group_name.to_string());
    }

    pub fn is_sport(&self) -> bool {
        self.course.id.starts_with("394") // TODO: check if there are more terms
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

#[derive(Clone, Debug, PartialEq)]
pub enum Grade {
    Grade(u8),
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
            Grade::Grade(grade) => serializer.serialize_str(grade.to_string().as_str()),
            Grade::Binary(val) if val => serializer.serialize_str("עבר"),
            Grade::Binary(_) => serializer.serialize_str("נכשל"),
            Grade::ExemptionWithoutCredit => serializer.serialize_str("פטור ללא ניקוד"),
            Grade::ExemptionWithCredit => serializer.serialize_str("פטור עם ניקוד"),
            Grade::NotComplete => serializer.serialize_str("לא השלים"),
        }
    }
}
struct StrVisitor;

impl<'de> Visitor<'de> for StrVisitor {
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
            _ if v.parse::<u8>().is_ok() => Ok(Grade::Grade(v.parse::<u8>().unwrap())),
            _ => Err(Err::invalid_type(Unexpected::Str(v), &self)),
        }
    }
}

impl<'de> Deserialize<'de> for Grade {
    fn deserialize<D>(deserializer: D) -> Result<Grade, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(StrVisitor)
    }
}

fn contains_course_number(str: &str) -> bool {
    for word in str.split_whitespace() {
        let course_number = word.parse::<u32>();
        match course_number {
            Ok(number) if 10000 < number && number < 999999 => return true,
            Ok(_) => continue,
            Err(_) => continue,
        }
    }
    false
}

pub fn vec_to_map(vec: Vec<Course>) -> HashMap<CourseId, Course> {
    HashMap::from_iter(
        vec.clone()
            .iter()
            .map(|course| course.id.clone())
            .zip(vec.into_iter()),
    )
}

pub fn parse_copy_paste_data(data: &str) -> Result<Vec<CourseStatus>, Error> {
    // Sanity validation
    if !(data.starts_with("גיליון ציונים") && data.contains("סוף גיליון ציונים"))
    {
        return Err(ErrorBadRequest("Bad Format"));
    }

    let mut courses = HashMap::<String, CourseStatus>::new();
    let mut asterisk_courses = Vec::<CourseStatus>::new();
    let mut sport_courses = Vec::<CourseStatus>::new();
    let mut semester = String::new();
    let mut semester_counter: f32 = 0.0;

    for line_ref in data.split_terminator('\n') {
        let line = line_ref.to_string();

        let is_spring = line.contains("אביב");
        let is_winter = line.contains("חורף");
        let is_summer = line.contains("קיץ");

        semester = if is_spring || is_summer || is_winter {
            semester_counter += if is_summer || semester_counter.fract() != 0.0 {
                0.5
            } else {
                1.0
            };

            let semester_term = match (is_spring, is_summer, is_winter) {
                (true, _, _) => "אביב",
                (_, true, _) => "קיץ",
                (_, _, true) => "חורף",
                _ => {
                    return Err(ErrorInternalServerError(
                        "Something really unexpected happened",
                    ))
                }
            };

            format!("{}_{}", semester_term, semester_counter)
        } else {
            semester
        };

        if !contains_course_number(&line) {
            continue;
        }

        let (course, grade) = parse_course_status_pdf_format(&line)?;

        let mut course_status = CourseStatus {
            course,
            semester: (!semester.is_empty()).then(|| semester.clone()),
            grade: grade.clone(),
            ..Default::default()
        };
        course_status.set_state();
        if course_status.is_sport() {
            sport_courses.push(course_status);
            continue;
        }
        if line.contains('*') {
            // If a student decides to retake a course for which he already had a grade,
            // and then ends up not receiving a grade (לא השלים) for that course,
            // The previous grade for this course is the valid one.
            // Nevertheless, the previous grade will appear with an asterisk (*) in the grades pdf.
            // Thus, to make sure we don't ignore these cases, we have to save a list of every asterisk-marked course,
            // and then search this list for courses who fall in this particular case, and fix their grade.
            asterisk_courses.push(course_status);
        } else {
            *courses
                .entry(course_status.course.id.clone())
                .or_insert(course_status) = course_status.clone();
        }
    }
    let mut vec_courses: Vec<_> = courses.into_values().collect();

    // Fix the grades for said courses
    set_grades_for_uncompleted_courses(&mut vec_courses, asterisk_courses.clone());

    vec_courses.append(&mut sport_courses);

    if vec_courses.is_empty() {
        return Err(ErrorBadRequest("Bad Format"));
    }
    Ok(vec_courses)
}

fn set_grades_for_uncompleted_courses(
    courses: &mut Vec<CourseStatus>,
    asterisk_courses: Vec<CourseStatus>,
) {
    // The canditate course statuses are those with uncomplete (לא השלים) grades.
    // For each uncompleted course status, we iterate the asterisk list in reverse to find
    // the closest (most chronologically advanced) course status with a grade (anything other than NotComplete (לא השלים)).
    // This course status will replace the old one.
    let uncompleted_courses = courses
        .iter_mut()
        .filter(|c| c.grade == Some(Grade::NotComplete))
        .collect::<Vec<_>>();
    for uncompleted_course in uncompleted_courses {
        for asterisk_course in asterisk_courses.iter().rev() {
            if let Some(grade) = &asterisk_course.grade {
                if uncompleted_course.course.id == asterisk_course.course.id
                    && grade != &Grade::NotComplete
                {
                    *uncompleted_course = asterisk_course.clone();
                    break;
                }
            }
        }
    }
}

fn parse_course_status_pdf_format(line: &str) -> Result<(Course, Option<Grade>), Error> {
    let clean_line = line.replace("*", "");
    let id = {
        let number = clean_line
            .split(' ')
            .next()
            .ok_or_else(|| ErrorBadRequest("Bad Format"))?;
        if number.parse::<f32>().is_ok() {
            Ok(String::from(number))
        } else {
            Err(ErrorBadRequest("Bad Format"))
        }?
    };

    let mut index = 0;
    let mut credit = 0.0;
    let mut word;
    for part in clean_line.split(' ') {
        word = part.to_string();
        // When a grade is missing, a hyphen (מקף) char is written instead, without any whitespaces between it and the credit.
        // This means that the credit part is no longer parsable as f32, and therefore the hyphen must be manually removed.
        // This won't create a problem later in the code since 'word' only lives in the for-loop scope.
        if word.contains('-') && word.contains('.') {
            word = word.replace('-', "").trim().to_string();
        }
        if word.parse::<f32>().is_ok() && word.contains('.') {
            credit = word
                .chars()
                .rev()
                .collect::<String>()
                .parse::<f32>()
                .unwrap();
            break;
        }
        index += 1;
    }

    let name = clean_line.split_whitespace().collect::<Vec<&str>>()[1..index].join(" ");

    let grade_str = clean_line
        .split(' ')
        .last()
        .ok_or_else(|| ErrorBadRequest("Bad Format"))?
        .trim();

    let grade = match grade_str as &str {
        "ניקוד" => {
            if clean_line.contains("ללא") {
                Some(Grade::ExemptionWithoutCredit)
            } else {
                Some(Grade::ExemptionWithCredit)
            }
        }
        "עבר" => Some(Grade::Binary(true)),
        "נכשל" => Some(Grade::Binary(false)), //TODO כתוב נכשל או שכתוב לא עבר?
        "השלים" if clean_line.contains("לא") => Some(Grade::NotComplete),
        _ => grade_str.parse::<u8>().ok().map(Grade::Grade),
    };
    Ok((Course { id, credit, name }, grade))
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_rt::test;

    #[test]
    async fn test_pdf_parser() {
        let from_pdf = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v.txt")
            .expect("Something went wrong reading the file");
        let courses_display_from_pdf =
            parse_copy_paste_data(&from_pdf).expect("failed to parse pdf data");

        assert_eq!(courses_display_from_pdf.len(), 41);

        let mut from_pdf_bad_prefix = from_pdf.clone();
        from_pdf_bad_prefix.replace_range(0..0, "א");

        assert!(parse_copy_paste_data(&from_pdf_bad_prefix).is_err());

        let from_pdf_bad_content = from_pdf.replace("סוף גיליון ציונים", "");

        assert!(parse_copy_paste_data(&from_pdf_bad_content).is_err());
    }

    #[test]
    async fn test_asterisk_course_edge_case() {
        let from_pdf = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v_3.txt")
            .expect("Something went wrong reading the file");
        let courses_display_from_pdf =
            parse_copy_paste_data(&from_pdf).expect("failed to parse pdf data");

        let edge_case_course = courses_display_from_pdf
            .iter()
            .find(|c| c.course.id == "234129")
            .unwrap();

        assert_eq!(edge_case_course.grade.as_ref().unwrap(), &Grade::Grade(67));
        assert_eq!(edge_case_course.semester.as_ref().unwrap(), "חורף_1");
    }
}
