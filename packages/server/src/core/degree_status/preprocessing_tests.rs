use std::collections::HashMap;

use crate::{
    core::types::Rule,
    resources::{
        catalog::{Catalog, Faculty},
        course::{Course, CourseBank, CourseState, CourseStatus, Grade},
    },
};

use super::*;

fn cs(
    id: &str,
    state: Option<CourseState>,
    modified: bool,
    semester: Option<&str>,
    bank_type: Option<&str>,
) -> CourseStatus {
    CourseStatus {
        course: Course {
            id: id.to_string(),
            credit: 1.0,
            name: id.to_string(),
            tags: None,
        },
        state,
        semester: semester.map(str::to_string),
        grade: Some(Grade::Numeric(80)),
        r#type: bank_type.map(str::to_string),
        modified,
        ..Default::default()
    }
}

fn make_catalog() -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: "catalog".to_string(),
        faculty: Faculty::Unknown,
        total_credit: 0.0,
        description: String::new(),
        course_banks: vec![CourseBank {
            name: "hova".to_string(),
            rule: Rule::All,
            credit: Some(1.0),
        }],
        credit_overflows: vec![],
        course_to_bank: HashMap::from([
            ("alg".to_string(), "hova".to_string()),
            ("dup".to_string(), "hova".to_string()),
        ]),
        catalog_replacements: HashMap::new(),
        common_replacements: HashMap::new(),
    }
}

#[test]
fn preprocess_removes_irrelevant_duplicate_when_user_added_same_course() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            cs(
                "dup",
                Some(CourseState::Irrelevant),
                false,
                Some("חורף_1"),
                Some("hova"),
            ),
            cs(
                "dup",
                Some(CourseState::NotComplete),
                true,
                Some("אביב_1"),
                Some("hova"),
            ),
        ],
        ..Default::default()
    };
    let mut catalog = make_catalog();

    degree_status.preprocess(&mut catalog);

    assert_eq!(degree_status.course_statuses.len(), 1);
    assert_eq!(degree_status.course_statuses[0].course.id, "dup");
    assert_ne!(
        degree_status.course_statuses[0].state,
        Some(CourseState::Irrelevant)
    );
}

#[test]
fn preprocess_clears_type_for_unmodified_and_irrelevant_courses() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            cs(
                "alg",
                Some(CourseState::Complete),
                false,
                Some("חורף_1"),
                Some("hova"),
            ),
            cs(
                "dup",
                Some(CourseState::Irrelevant),
                true,
                Some("אביב_1"),
                Some("hova"),
            ),
            cs(
                "ok",
                Some(CourseState::Complete),
                true,
                Some("קיץ_1.5"),
                Some("hova"),
            ),
        ],
        ..Default::default()
    };
    let mut catalog = make_catalog();

    degree_status.preprocess(&mut catalog);

    assert_eq!(degree_status.get_course_status("alg").unwrap().r#type, None);
    assert_eq!(degree_status.get_course_status("dup").unwrap().r#type, None);
    assert_eq!(
        degree_status.get_course_status("ok").unwrap().r#type,
        Some("hova".to_string())
    );
}

#[test]
fn preprocess_removes_irrelevant_courses_from_catalog_mapping() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            cs(
                "alg",
                Some(CourseState::Irrelevant),
                true,
                Some("חורף_2"),
                Some("hova"),
            ),
            cs(
                "dup",
                Some(CourseState::Complete),
                true,
                Some("חורף_1"),
                Some("hova"),
            ),
        ],
        ..Default::default()
    };
    let mut catalog = make_catalog();

    degree_status.preprocess(&mut catalog);

    assert!(!catalog.course_to_bank.contains_key("alg"));
    assert!(catalog.course_to_bank.contains_key("dup"));
    assert_eq!(degree_status.course_statuses[0].course.id, "dup");
}
