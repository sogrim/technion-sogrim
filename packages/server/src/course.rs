use crate::core::*;
use actix_web::error::ErrorInternalServerError;
use actix_web::{error::ErrorBadRequest, Error};
use serde::de::{Error as Err, Unexpected, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;
use std::iter::FromIterator;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Course {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub number: u32,
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
    const MALAG_EXCEPTIONS: &'static [u32] = &[324033]; //TODO think about this

    pub fn passed(&self) -> bool {
        match &self.grade {
            Some(grade) => match grade {
                Grade::Grade(grade) => grade >= &55,
                Grade::Binary(val) => *val,
                Grade::ExemptionWithoutCredit => true,
                Grade::ExemptionWithCredit => true,
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

    pub fn is_malag(&self) -> bool {
        self.course.number / 1000 == 324 && !Self::MALAG_EXCEPTIONS.contains(&self.course.number)
        // TODO: check if there are more terms
    }
    pub fn is_sport(&self) -> bool {
        self.course.number / 1000 == 394 // TODO: check if there are more terms
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CourseBank {
    pub name: String, // for example, Hova, Reshima A.
    pub rule: Rule,
    pub credit: Option<f32>,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Grade {
    Grade(u8),
    Binary(bool),
    ExemptionWithoutCredit,
    ExemptionWithCredit,
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

pub fn vec_to_map(vec: Vec<Course>) -> HashMap<u32, Course> {
    HashMap::from_iter(
        vec.clone()
            .iter()
            .map(|course| course.number)
            .zip(vec.into_iter()),
    )
}

pub fn parse_copy_paste_data(data: &str) -> Result<Vec<CourseStatus>, Error> {
    let mut courses = HashMap::<u32, CourseStatus>::new();
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

            let semester_term = if is_spring {
                "אביב"
            } else if is_summer {
                "קיץ"
            } else if is_winter {
                "חורף"
            } else {
                return Err(ErrorInternalServerError(
                    "Something really unexpected happened",
                ));
            };

            format!("{}_{}", semester_term, semester_counter)
        } else {
            semester
        };

        if !contains_course_number(&line) || line.contains('*') {
            continue;
        }

        let (course, grade) = if data.starts_with("גיליון ציונים") {
            parse_course_status_pdf_format(line)?
        } else {
            parse_course_status_ug_format(line)?
        };

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
        *courses
            .entry(course_status.course.number)
            .or_insert(course_status) = course_status.clone();
    }
    let mut vec_courses: Vec<_> = courses.into_values().collect();
    vec_courses.append(&mut sport_courses);
    Ok(vec_courses)
}

fn parse_course_status_ug_format(line: String) -> Result<(Course, Option<Grade>), Error> {
    let line_parts: Vec<_> = line.split('\t').collect();
    let grade_str = line_parts[0];
    let grade = match grade_str.parse::<u8>() {
        Ok(num) => Some(Grade::Grade(num)),
        Err(_) => {
            if grade_str == "פטור ללא ניקוד" {
                Some(Grade::ExemptionWithoutCredit)
            } else if grade_str == "פטור עם ניקוד" {
                Some(Grade::ExemptionWithCredit)
            } else if grade_str == "עבר" || grade_str == "נכשל" {
                //TODO כתוב נכשל או שכתוב לא עבר?
                Some(Grade::Binary(grade_str == "עבר"))
            } else {
                None
            }
        }
    };
    let course_parts: Vec<_> = line_parts[2].split_whitespace().collect();
    let credit = line_parts[1]
        .parse::<f32>()
        .map_err(|err| ErrorBadRequest(err.to_string()))?;
    let number = course_parts
        .last()
        .ok_or_else(|| ErrorBadRequest("Parse Error: Empty Course Parts"))?
        .parse::<u32>()
        .map_err(|err| ErrorBadRequest(err.to_string()))?;
    let name = course_parts[..course_parts.len() - 1]
        .join(" ")
        .trim()
        .to_string();
    Ok((
        Course {
            credit,
            number,
            name,
        },
        grade,
    ))
}

fn parse_course_status_pdf_format(line: String) -> Result<(Course, Option<Grade>), Error> {
    let number = line
        .split(' ')
        .next()
        .ok_or_else(|| ErrorBadRequest("Bad Format"))?
        .parse::<u32>()
        .map_err(|err| ErrorBadRequest(err.to_string()))?;

    let mut index = 0;
    let mut credit = 0.0;
    let mut word;
    for part in line.split(' ') {
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

    let name = line.split_whitespace().collect::<Vec<&str>>()[1..index].join(" ");

    let grade_str = line
        .split(' ')
        .last()
        .ok_or_else(|| ErrorBadRequest("Bad Format"))?
        .trim();

    let grade = match grade_str as &str {
        "ניקוד" => {
            if line.contains("ללא") {
                Some(Grade::ExemptionWithoutCredit)
            } else {
                Some(Grade::ExemptionWithCredit)
            }
        }
        "עבר" => Some(Grade::Binary(true)),
        "נכשל" => Some(Grade::Binary(false)), //TODO כתוב נכשל או שכתוב לא עבר?
        _ => grade_str.parse::<u8>().ok().map(Grade::Grade),
    };
    Ok((
        Course {
            number,
            credit,
            name,
        },
        grade,
    ))
}

#[cfg(test)]
mod tests {
    #[allow(unused)]
    use super::*;
    #[allow(unused)]
    use actix_rt::test;

    // TODO: uncomment this test after we fix it
    // #[allow(clippy::float_cmp)]
    // #[test]
    // async fn test_both_parsers() {
    //     let from_pdf = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v.txt")
    //         .expect("Something went wrong reading the file");
    //     let from_ug = std::fs::read_to_string("../docs/ug_ctrl_c_ctrl_v.txt")
    //         .expect("Something went wrong reading the file");
    //     let mut courses_display_from_pdf =
    //         parse_copy_paste_data(&from_pdf).expect("failed to parse pdf data");
    //     let mut courses_display_from_ug =
    //         parse_copy_paste_data(&from_ug).expect("failed to parse ug data");
    //     courses_display_from_pdf
    //         .sort_by(|a, b| a.course.number.partial_cmp(&b.course.number).unwrap());
    //     courses_display_from_ug
    //         .sort_by(|a, b| a.course.number.partial_cmp(&b.course.number).unwrap());
    //     for i in 0..courses_display_from_pdf.len() {
    //         assert_eq!(
    //             courses_display_from_ug[i].grade,
    //             courses_display_from_pdf[i].grade
    //         );
    //         assert_eq!(
    //             courses_display_from_ug[i].semester,
    //             courses_display_from_pdf[i].semester
    //         );
    //         assert_eq!(
    //             courses_display_from_ug[i].course.number,
    //             courses_display_from_pdf[i].course.number
    //         );
    //         assert_eq!(
    //             courses_display_from_ug[i].course.credit,
    //             courses_display_from_pdf[i].course.credit
    //         );
    //     }
    // }
}
