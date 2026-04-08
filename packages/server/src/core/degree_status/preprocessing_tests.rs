use std::collections::HashMap;

use crate::{
    core::types::Rule,
    resources::{
        catalog::{Catalog, Faculty},
        course::{Course, CourseBank, CourseId, CourseState, CourseStatus, Grade},
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
            id: CourseId::new(id),
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
            (CourseId::new("alg"), "hova".to_string()),
            (CourseId::new("dup"), "hova".to_string()),
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

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert_eq!(degree_status.course_statuses.len(), 1);
    assert_eq!(*degree_status.course_statuses[0].course.id, *"dup");
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

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert_eq!(
        degree_status
            .get_course_status(&CourseId::new("alg"))
            .unwrap()
            .r#type,
        None
    );
    assert_eq!(
        degree_status
            .get_course_status(&CourseId::new("dup"))
            .unwrap()
            .r#type,
        None
    );
    assert_eq!(
        degree_status
            .get_course_status(&CourseId::new("ok"))
            .unwrap()
            .r#type,
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

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert!(!catalog.course_to_bank.contains_key("alg"));
    assert!(catalog.course_to_bank.contains_key("dup"));
    assert_eq!(*degree_status.course_statuses[0].course.id, *"dup");
}

// ---- 6-digit → 8-digit normalization tests ----

#[test]
fn preprocess_normalizes_standard_6digit_course_id_to_8digit() {
    // Standard: ABCDEF → 0ABC0DEF
    let mut degree_status = DegreeStatus {
        course_statuses: vec![cs(
            "234107",
            Some(CourseState::Complete),
            true,
            Some("חורף_1"),
            Some("hova"),
        )],
        ..Default::default()
    };
    let mut catalog = make_catalog();

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert_eq!(*degree_status.course_statuses[0].course.id, *"02340107");
}

#[test]
fn preprocess_normalizes_nonstandard_6digit_course_id_to_8digit() {
    // Non-standard (prefix 51): ABCDEF → AB0C0DEF
    let mut degree_status = DegreeStatus {
        course_statuses: vec![cs(
            "514003",
            Some(CourseState::Complete),
            true,
            Some("חורף_1"),
            Some("hova"),
        )],
        ..Default::default()
    };
    let mut catalog = make_catalog();

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert_eq!(*degree_status.course_statuses[0].course.id, *"51040003");
}

#[test]
fn preprocess_does_not_modify_already_8digit_course_id() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![cs(
            "02340107",
            Some(CourseState::Complete),
            true,
            Some("חורף_1"),
            Some("hova"),
        )],
        ..Default::default()
    };
    let mut catalog = make_catalog();

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert_eq!(*degree_status.course_statuses[0].course.id, *"02340107");
}

#[test]
fn preprocess_normalizes_catalog_6digit_keys_to_8digit() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![cs(
            "02340107",
            Some(CourseState::Complete),
            true,
            Some("חורף_1"),
            Some("hova"),
        )],
        ..Default::default()
    };
    let mut catalog = make_catalog();
    catalog
        .course_to_bank
        .insert(CourseId::new("234107"), "hova".to_string());

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert!(!catalog.course_to_bank.contains_key("234107"));
    assert!(catalog.course_to_bank.contains_key("02340107"));
}

#[test]
fn preprocess_normalizes_catalog_replacements_keys_and_values() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![cs(
            "02340107",
            Some(CourseState::Complete),
            true,
            Some("חורף_1"),
            Some("hova"),
        )],
        ..Default::default()
    };
    let mut catalog = make_catalog();
    catalog
        .catalog_replacements
        .insert(CourseId::new("234107"), vec![CourseId::new("514003")]);

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert!(!catalog.catalog_replacements.contains_key("234107"));
    let values = catalog.catalog_replacements.get("02340107").unwrap();
    assert_eq!(values, &vec![CourseId::new("51040003")]);
}

#[test]
fn preprocess_normalizes_all_nonstandard_prefixes() {
    // Verify each non-standard prefix (52, 61, 97) converts correctly
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            cs(
                "521234",
                Some(CourseState::Complete),
                true,
                Some("חורף_1"),
                None,
            ),
            cs(
                "611234",
                Some(CourseState::Complete),
                true,
                Some("אביב_1"),
                None,
            ),
            cs(
                "971234",
                Some(CourseState::Complete),
                true,
                Some("קיץ_1.5"),
                None,
            ),
        ],
        ..Default::default()
    };
    let mut catalog = make_catalog();

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert_eq!(*degree_status.course_statuses[0].course.id, *"52010234");
    assert_eq!(*degree_status.course_statuses[1].course.id, *"61010234");
    assert_eq!(*degree_status.course_statuses[2].course.id, *"97010234");
}

#[test]
fn preprocess_normalizes_mixed_6digit_and_8digit_courses() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            cs(
                "234107",
                Some(CourseState::Complete),
                true,
                Some("חורף_1"),
                None,
            ),
            cs(
                "02360218",
                Some(CourseState::Complete),
                true,
                Some("אביב_1"),
                None,
            ),
        ],
        ..Default::default()
    };
    let mut catalog = make_catalog();

    degree_status.preprocess(&mut catalog, &mut HashMap::new());

    assert_eq!(*degree_status.course_statuses[0].course.id, *"02340107");
    assert_eq!(*degree_status.course_statuses[1].course.id, *"02360218");
}
