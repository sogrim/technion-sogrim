use std::collections::HashMap;

use crate::{
    consts::{self, medicine},
    core::{messages, types::Rule},
    resources::{
        catalog::{Catalog, Faculty},
        course::{Course, CourseBank, CourseState, CourseStatus, Grade, Tag},
    },
};

use super::*;

fn english_course(id: &str, grade: Grade) -> CourseStatus {
    CourseStatus {
        course: Course {
            id: id.to_string(),
            credit: 2.0,
            name: id.to_string(),
            tags: Some(vec![Tag::English]),
        },
        state: Some(CourseState::Complete),
        grade: Some(grade),
        ..Default::default()
    }
}

fn regular_course(id: &str, bank: &str, grade: Grade, repeats: usize) -> CourseStatus {
    CourseStatus {
        course: Course {
            id: id.to_string(),
            credit: 3.0,
            name: id.to_string(),
            tags: None,
        },
        state: Some(CourseState::Complete),
        grade: Some(grade),
        r#type: Some(bank.to_string()),
        times_repeated: repeats,
        semester: Some("חורף_1".to_string()),
        ..Default::default()
    }
}

fn catalog(name: &str, faculty: Faculty, course_banks: Vec<CourseBank>) -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: name.to_string(),
        faculty,
        total_credit: 0.0,
        description: String::new(),
        course_banks,
        credit_overflows: vec![],
        course_to_bank: HashMap::new(),
        catalog_replacements: HashMap::new(),
        common_replacements: HashMap::new(),
    }
}

#[test]
fn english_requirement_is_not_checked_for_old_catalog_years() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![english_course(
            consts::TECHNICAL_ENGLISH_ADVANCED_B,
            Grade::ExemptionWithCredit,
        )],
        ..Default::default()
    };
    let catalog = catalog("CS 2020", Faculty::ComputerScience, vec![]);

    degree_status.postprocess(&catalog);

    assert!(degree_status.overflow_msgs.is_empty());
}

#[test]
fn english_requirement_warns_exempt_students_with_missing_english_content() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![english_course(
            consts::TECHNICAL_ENGLISH_ADVANCED_B,
            Grade::ExemptionWithoutCredit,
        )],
        ..Default::default()
    };
    let catalog = catalog("CS 2022", Faculty::ComputerScience, vec![]);

    degree_status.postprocess(&catalog);

    assert_eq!(
        degree_status.overflow_msgs,
        vec![messages::english_requirement_for_exempt_students_msg()]
    );
}

#[test]
fn medicine_postprocessing_reports_zero_average_when_no_numeric_grades() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![CourseStatus {
            course: Course {
                id: "med".to_string(),
                credit: 3.0,
                name: "med".to_string(),
                tags: None,
            },
            state: Some(CourseState::Complete),
            grade: Some(Grade::Binary(true)),
            r#type: Some(medicine::ALL_BANK_NAME.to_string()),
            ..Default::default()
        }],
        ..Default::default()
    };
    let catalog = catalog(
        "Medicine 2022",
        Faculty::Medicine,
        vec![
            CourseBank {
                name: medicine::ALL_BANK_NAME.to_string(),
                rule: Rule::All,
                credit: Some(1.0),
            },
            CourseBank {
                name: medicine::SPORT_BANK_NAME.to_string(),
                rule: Rule::All,
                credit: Some(1.0),
            },
            CourseBank {
                name: medicine::FACULTY_ELECTIVE_BANK_NAME.to_string(),
                rule: Rule::All,
                credit: Some(1.0),
            },
        ],
    );

    degree_status.postprocess(&catalog);

    assert!(degree_status
        .overflow_msgs
        .contains(&messages::medicine_preclinical_avg_msg(0.0)));
}

#[test]
fn medicine_postprocessing_flags_course_repetition_violations() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![regular_course(
            "med-repeat",
            medicine::ALL_BANK_NAME,
            Grade::Numeric(90),
            medicine::PRECLINICAL_COURSE_REPETITIONS_LIMIT,
        )],
        ..Default::default()
    };
    let catalog = catalog(
        "Medicine 2022",
        Faculty::Medicine,
        vec![
            CourseBank {
                name: medicine::ALL_BANK_NAME.to_string(),
                rule: Rule::All,
                credit: Some(1.0),
            },
            CourseBank {
                name: medicine::SPORT_BANK_NAME.to_string(),
                rule: Rule::All,
                credit: Some(1.0),
            },
            CourseBank {
                name: medicine::FACULTY_ELECTIVE_BANK_NAME.to_string(),
                rule: Rule::All,
                credit: Some(1.0),
            },
        ],
    );

    degree_status.postprocess(&catalog);

    assert!(degree_status.overflow_msgs.iter().any(|msg| {
        msg == &messages::medicine_preclinical_course_repetitions_error_msg(
            degree_status
                .course_statuses
                .iter()
                .filter(|cs| cs.course.id == "med-repeat")
                .collect(),
        )
    }));
}
