use crate::core::*;
use actix_web::error::ErrorInternalServerError;
use actix_web::{error::ErrorBadRequest, Error};
use serde::de::{Error as Err, Unexpected, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;

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
    pub name: String, // for example, Hova, Rshima A.
    pub rule: Rule,
    pub credit: Option<f32>,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CourseTableRow {
    pub number: u32,
    pub course_banks: Vec<String>, // שמות הבנקים. שימו לב לקבוצת ההתמחות
}

#[derive(Clone, Debug)]
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

pub fn parse_copy_paste_from_ug(ug_data: &str) -> Result<Vec<CourseStatus>, Error> {
    let mut courses = HashMap::<u32, CourseStatus>::new();
    let mut sport_courses = Vec::<CourseStatus>::new();
    let mut semester = String::new();
    let mut semester_counter: f32 = 0.0;

    for line_ref in ug_data.split_terminator('\n') {
        let line = line_ref.to_string();

        semester = if line.contains("אביב") || line.contains("חורף") || line.contains("קיץ")
        {
            semester_counter += if line.contains("קיץ") || semester_counter.fract() != 0.0 {
                0.5
            } else {
                1.0
            };

            let semester_term = line
                .split_whitespace()
                .next()
                .ok_or_else(|| ErrorBadRequest("Parse Error: Missing Whitespace"))?;

            format!("{}_{}", semester_term, semester_counter)
        } else {
            semester
        };

        if !contains_course_number(&line) {
            continue;
        }

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
        let mut course = CourseStatus {
            course: Course {
                number,
                credit,
                name,
            },
            semester: (!semester.is_empty()).then(|| semester.clone()),
            grade: grade.clone(),
            ..Default::default()
        };
        course.set_state();
        if course.is_sport() {
            sport_courses.push(course);
            continue;
        }
        *courses.entry(number).or_insert(course) = course.clone();
    }
    let mut vec_courses: Vec<_> = courses.into_values().collect();
    vec_courses.append(&mut sport_courses);
    Ok(vec_courses)
}

pub fn parse_copy_paste_from_pdf(pdf_data: &str) -> Result<Vec<CourseStatus>, Error> {
    let mut courses = HashMap::<u32, CourseStatus>::new();
    let mut sport_courses = Vec::<CourseStatus>::new();
    let mut semester = String::new();
    let mut semester_counter: f32 = 0.0;

    for line_ref in pdf_data.split_terminator('\n') {
        let line = line_ref.to_string();

        let is_spring = line.contains("אביב");
        let is_winter = line.contains("חורף");
        let is_summer = line.contains("קיץ");

        semester = if is_spring || is_summer || is_winter
        {
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
                return Err(ErrorInternalServerError("Something really unexcepted happend"))
            };

            format!("{}_{}", semester_term, semester_counter)
        } else {
            semester
        };

        if !contains_course_number(&line) || line.contains('*') {
            continue;
        }

        let number = line
            .split(' ')
            .next()
            .ok_or_else(|| ErrorBadRequest("Bad Format"))?
            .parse::<u32>()
            .map_err(|err| ErrorBadRequest(err.to_string()))?;

        let mut index = 0;
        let mut credit = 0.0;
        for mut word in line.split(' '){
            //TODO explain this abomination
            if word.contains('-') && word.contains('.'){ 
                word = &word[0..word.len() - 2];
            }
            if word.parse::<f32>().is_ok() && word.contains('.') {
                credit = word.chars().rev().collect::<String>().parse::<f32>().unwrap();
                break;
            }
            index += 1;
        }

        let name = line
            .split_whitespace()
            .collect::<Vec<&str>>()[1..index]
            .join(" ");

        let grade_str = line
            .split(' ')
            .last()
            .ok_or_else(|| ErrorBadRequest("Bad Format"))?
            .trim();
        
        let grade = match grade_str as &str {
            "ניקוד" => {
                if line.contains("ללא"){
                    Some(Grade::ExemptionWithoutCredit)
                } else {
                    Some(Grade::ExemptionWithCredit)
                }
            },
            "עבר" => Some(Grade::Binary(true)),
            "נכשל" => Some(Grade::Binary(false)), //TODO כתוב נכשל או שכתוב לא עבר?
            _  => grade_str.parse::<u8>().ok().map(Grade::Grade)
        };

        let mut course = CourseStatus {
            course: Course {
                number,
                credit,
                name,
            },
            semester: (!semester.is_empty()).then(|| semester.clone()),
            grade: grade.clone(),
            ..Default::default()
        };
        course.set_state();
        if course.is_sport() {
            sport_courses.push(course);
            continue;
        }
        *courses.entry(number).or_insert(course) = course.clone();
    }
    let mut vec_courses: Vec<_> = courses.into_values().collect();
    vec_courses.append(&mut sport_courses);
    Ok(vec_courses)
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_rt::test;

    #[test]
    async fn test_ug_course_parser() {
        let contents = std::fs::read_to_string("../docs/ug_ctrl_c_ctrl_v.txt")
            .expect("Something went wrong reading the file");
        let mut courses_display =
            parse_copy_paste_from_ug(&contents).expect("failed to parse ug data");
        courses_display.sort_by(|a, b| a.course.credit.partial_cmp(&b.course.credit).unwrap());
        for course_display in courses_display {
            println!("{:?}", course_display); // TODO change to asserts
        }
    }

    #[test]
    async fn test_pdf_course_parser() {
        let contents = std::fs::read_to_string("ug_ctrl_c_ctrl_v.txt")
            .expect("Something went wrong reading the file");
        let mut courses_display =
            parse_copy_paste_from_pdf(&contents).expect("failed to parse ug data");
        courses_display.sort_by(|a, b| a.course.credit.partial_cmp(&b.course.credit).unwrap());
        for course_display in courses_display {
            println!("{:?}", course_display); // TODO change to asserts
        }
    }

    // #[test]
    // async fn test_create_degree_status_mock(){

    //     let degree_status = DegreeStatus{
    //         course_statuses: vec![
    //             CourseStatus{
    //                 course: Course{
    //                     number: 234125,
    //                     credit: 5.5,
    //                     name: "אינפי 1 לניסנים".into()
    //                 },
    //                 state: Some(CourseState::Complete),
    //                 semester: Some("חורף_1".into()),
    //                 grade: Some(Grade::Grade(98)),
    //                 r#type: Some("חובה".into()),
    //                 additional_msg: None,
    //             },
    //             CourseStatus{
    //                 course: Course{
    //                     number: 234126,
    //                     credit: 5.0,
    //                     name: "אינפי 2 לניסנים".into()
    //                 },
    //                 state: Some(CourseState::NotComplete),
    //                 semester: Some("אביב_2".into()),
    //                 grade: Some(Grade::Grade(45)),
    //                 r#type: Some("חובה".into()),
    //                 additional_msg: None,
    //             },
    //             CourseStatus{
    //                 course: Course{
    //                     number: 234125,
    //                     credit: 4.0,
    //                     name: "אינפי 3 לניסנים".into()
    //                 },
    //                 state: Some(CourseState::Complete),
    //                 semester: Some("חורף_3".into()),
    //                 grade: Some(Grade::Binary(true)),
    //                 r#type: Some("חובה".into()),
    //                 additional_msg: None,
    //             },
    //             CourseStatus{
    //                 course: Course{
    //                     number: 234127,
    //                     credit: 3.0,
    //                     name: "קורס בחירה כלשהו".into()
    //                 },
    //                 state: Some(CourseState::Complete),
    //                 semester: Some("חורף_3".into()),
    //                 grade: Some(Grade::ExemptionWithCredit),
    //                 r#type: Some("רשימה א'".into()),
    //                 additional_msg: None,
    //             },

    //         ],
    //         course_bank_requirements: vec![
    //             Requirement{
    //                 course_bank_name: "חובה".into(),
    //                 bank_rule_name: "all".into(),
    //                 requirment: 84.0,
    //                 complete: 9.5,
    //                 message: Some("תראה את ניסן הגבר הזה כמה אינפים הוא עשה".into()),
    //             },
    //             Requirement{
    //                 course_bank_name: "בחירה חופשית".into(),
    //                 bank_rule_name: "accumulate credit".into(),
    //                 requirment: 2.0,
    //                 ..Default::default()
    //             }
    //         ],
    //         overflow_msgs: vec![
    //             r#"2.5 נק"ז עובר משרשרת מדעית לרשימה ב'"#.to_string(),
    //             r#"2.0 נק"ז עובר מרשימה ב' לבחירה חופשית"#.to_string(),
    //         ],
    //         total_credit: 76.5,
    //     };

    //     //let serialized = bson::to_bson(&degree_status).unwrap();
    //     std::fs::write(
    //         "degree_status_mock.json",
    //     serde_json::to_string_pretty(&degree_status)
    //         .expect("json serialization failed")
    //     ).expect("Unable to write file");
    // }

    #[test]
    async fn test_ser_deser_course() {
        let course = Course {
            number: 234,
            credit: 2.5,
            name: "some_course".into(),
        };
        let serialized = bson::to_bson(&course).unwrap();
        println!("{}", serialized);
        let doc = bson::to_document(&serialized).unwrap();
        println!("{}", doc);
        let deserialized = bson::from_document::<Course>(doc).unwrap();
        println!("{:?}", deserialized);

        let vec = vec![course.clone(), course];
        let serialized_vec = bson::to_bson(&vec).unwrap();
        println!("{}", serialized_vec);
        let doc_vec = bson::doc! {"vec" : serialized_vec};
        println!("{}", doc_vec);
    }
}
