use serde_json::json;

use super::catalog::{Catalog, Faculty};
use super::course::{Course, CourseBank, CourseId, CourseState, CourseStatus, Grade};
use crate::core::types::Rule;

#[tokio::test]
async fn test_course_state_serde() {
    let course_states = vec![
        CourseState::Complete,
        CourseState::NotComplete,
        CourseState::InProgress,
        CourseState::Irrelevant,
    ];
    let json = json!(course_states);
    assert_eq!(json, json!(["הושלם", "לא הושלם", "בתהליך", "לא רלוונטי"]));

    let vec: Vec<CourseState> = serde_json::from_value(json).expect("Fail to deserialize");
    assert_eq!(vec, course_states);

    let res: Result<CourseState, _> = serde_json::from_value(json!("השלים"));
    assert!(res.is_err());
    assert!(
        format!("{res:#?}").contains("expected a valid string representation of a course state")
    );
}

#[tokio::test]
async fn test_course_grade_serde() {
    let course_grades = vec![
        Grade::Numeric(95),
        Grade::Binary(true),
        Grade::Binary(false),
        Grade::ExemptionWithoutCredit,
        Grade::ExemptionWithCredit,
        Grade::NotComplete,
    ];
    let json = json!(course_grades);
    assert_eq!(
        json,
        json!([
            "95",
            "עבר",
            "נכשל",
            "פטור ללא ניקוד",
            "פטור עם ניקוד",
            "לא השלים"
        ])
    );

    let vec: Vec<Grade> = serde_json::from_value(json).expect("Fail to deserialize");
    assert_eq!(vec, course_grades);

    let res: Result<Grade, _> = serde_json::from_value(json!("-"));
    assert!(res.is_err());
    assert!(format!("{res:#?}").contains("expected a valid string representation of a grade"));
}

fn make_catalog(name: &str, banks: Vec<(&str, Rule)>, courses: Vec<(&str, &str)>) -> Catalog {
    Catalog {
        name: name.to_string(),
        course_banks: banks
            .into_iter()
            .map(|(bank_name, rule)| CourseBank {
                name: bank_name.to_string(),
                rule,
                credit: Some(10.0),
            })
            .collect(),
        course_to_bank: courses
            .into_iter()
            .map(|(course_id, bank)| (CourseId::new(course_id), bank.to_string()))
            .collect(),
        ..Default::default()
    }
}

#[test]
fn test_track_name_strips_single_year() {
    let catalog = Catalog {
        name: "מדמח תלת שנתי 2022".to_string(),
        ..Default::default()
    };
    assert_eq!(catalog.track_name(), "מדמח תלת שנתי");
}

#[test]
fn test_track_name_strips_year_range() {
    let catalog = Catalog {
        name: "מדמח תלת שנתי 2022-2023".to_string(),
        ..Default::default()
    };
    assert_eq!(catalog.track_name(), "מדמח תלת שנתי");
}

#[test]
fn test_track_name_no_year() {
    let catalog = Catalog {
        name: "מדמח תלת שנתי".to_string(),
        ..Default::default()
    };
    assert_eq!(catalog.track_name(), "מדמח תלת שנתי");
}

#[test]
fn test_enrich_adds_missing_courses_from_sibling() {
    let mut chosen = make_catalog(
        "מדמח תלת שנתי 2022-2023",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![("23600001", "רשימה א")],
    );

    let sibling = make_catalog(
        "מדמח תלת שנתי 2023-2024",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![
            ("23600001", "רשימה א"), // already in chosen
            ("23600002", "רשימה א"), // new course
        ],
    );

    chosen.enrich_with_sibling_courses(&[sibling]);

    assert_eq!(chosen.course_to_bank.len(), 2);
    assert_eq!(
        chosen.course_to_bank.get(&CourseId::new("23600002")),
        Some(&"רשימה א".to_string())
    );
}

#[test]
fn test_enrich_does_not_override_existing_courses() {
    let mut chosen = make_catalog(
        "מדמח תלת שנתי 2022-2023",
        vec![
            ("רשימה א", Rule::AccumulateCredit),
            ("רשימה ב", Rule::AccumulateCredit),
        ],
        vec![("23600001", "רשימה א")],
    );

    let sibling = make_catalog(
        "מדמח תלת שנתי 2023-2024",
        vec![("רשימה ב", Rule::AccumulateCredit)],
        vec![("23600001", "רשימה ב")], // same course, different bank in sibling
    );

    chosen.enrich_with_sibling_courses(&[sibling]);

    // The course should remain in "רשימה א" (chosen catalog priority)
    assert_eq!(
        chosen.course_to_bank.get(&CourseId::new("23600001")),
        Some(&"רשימה א".to_string())
    );
    assert_eq!(chosen.course_to_bank.len(), 1);
}

#[test]
fn test_enrich_only_merges_accumulate_banks() {
    let mut chosen = make_catalog(
        "מדמח תלת שנתי 2022-2023",
        vec![("חובה", Rule::All), ("רשימה א", Rule::AccumulateCredit)],
        vec![],
    );

    let sibling = make_catalog(
        "מדמח תלת שנתי 2023-2024",
        vec![("חובה", Rule::All), ("רשימה א", Rule::AccumulateCredit)],
        vec![
            ("23600001", "חובה"),    // from an All bank — should NOT be merged
            ("23600002", "רשימה א"), // from AccumulateCredit — should be merged
        ],
    );

    chosen.enrich_with_sibling_courses(&[sibling]);

    assert_eq!(chosen.course_to_bank.len(), 1);
    assert_eq!(
        chosen.course_to_bank.get(&CourseId::new("23600002")),
        Some(&"רשימה א".to_string())
    );
}

#[test]
fn test_enrich_skips_bank_not_in_chosen_catalog() {
    let mut chosen = make_catalog(
        "מדמח תלת שנתי 2022-2023",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![],
    );

    let sibling = make_catalog(
        "מדמח תלת שנתי 2023-2024",
        vec![("רשימה ג", Rule::AccumulateCredit)], // bank name doesn't exist in chosen
        vec![("23600001", "רשימה ג")],
    );

    chosen.enrich_with_sibling_courses(&[sibling]);

    assert_eq!(chosen.course_to_bank.len(), 0);
}

#[test]
fn test_enrich_skips_self() {
    let mut chosen = make_catalog(
        "מדמח תלת שנתי 2022-2023",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![("23600001", "רשימה א")],
    );

    // Pass itself as a sibling — should not duplicate anything
    let mut clone = chosen.clone();
    clone
        .course_to_bank
        .insert(CourseId::new("23600002"), "רשימה א".to_string()); // add a different course to the clone to ensure it's skipped.
    chosen.enrich_with_sibling_courses(&[clone]);

    assert_eq!(chosen.course_to_bank.len(), 1);
}

#[test]
fn test_enrich_merges_accumulate_courses_bank() {
    let mut chosen = make_catalog(
        "מדמח תלת שנתי 2022-2023",
        vec![("רשימה ב", Rule::AccumulateCourses(3))],
        vec![("23600001", "רשימה ב")],
    );

    let sibling = make_catalog(
        "מדמח תלת שנתי 2021-2022",
        vec![("רשימה ב", Rule::AccumulateCourses(3))],
        vec![("23600002", "רשימה ב")],
    );

    chosen.enrich_with_sibling_courses(&[sibling]);

    assert_eq!(chosen.course_to_bank.len(), 2);
    assert_eq!(
        chosen.course_to_bank.get(&CourseId::new("23600002")),
        Some(&"רשימה ב".to_string())
    );
}

#[test]
fn test_enrich_with_multiple_siblings() {
    let mut chosen = make_catalog(
        "מדמח תלת שנתי 2022-2023",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![("23600001", "רשימה א")],
    );

    let sibling1 = make_catalog(
        "מדמח תלת שנתי 2021-2022",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![("23600002", "רשימה א")],
    );
    let sibling2 = make_catalog(
        "מדמח תלת שנתי 2023-2024",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![("23600003", "רשימה א")],
    );

    chosen.enrich_with_sibling_courses(&[sibling1, sibling2]);

    assert_eq!(chosen.course_to_bank.len(), 3);
    assert!(chosen
        .course_to_bank
        .contains_key(&CourseId::new("23600001")));
    assert!(chosen
        .course_to_bank
        .contains_key(&CourseId::new("23600002")));
    assert!(chosen
        .course_to_bank
        .contains_key(&CourseId::new("23600003")));
}

fn make_course_status(course_id: &str, credit: f32) -> CourseStatus {
    CourseStatus {
        course: Course {
            id: CourseId::new(course_id),
            credit,
            name: format!("Course {course_id}"),
            tags: None,
        },
        state: Some(CourseState::Complete),
        grade: Some(Grade::Numeric(85)),
        semester: Some("winter_1".to_string()),
        modified: false,
        ..Default::default()
    }
}

// --- course_prefixes tests ---

#[test]
fn test_course_prefixes_computer_science() {
    let catalog = Catalog {
        faculty: Faculty::ComputerScience,
        ..Default::default()
    };
    let prefixes = catalog.course_prefixes();
    assert!(prefixes.contains(&"0234"));
    assert!(prefixes.contains(&"0236"));
}

#[test]
fn test_course_prefixes_unknown_faculty() {
    let catalog = Catalog {
        faculty: Faculty::Unknown,
        ..Default::default()
    };
    assert!(catalog.course_prefixes().is_empty());
}

// --- default_accumulate_bank tests ---

#[test]
fn test_default_accumulate_bank_picks_largest() {
    let catalog = make_catalog(
        "test",
        vec![
            ("רשימה א", Rule::AccumulateCredit),
            ("רשימה ב", Rule::AccumulateCredit),
        ],
        vec![
            ("02340001", "רשימה א"),
            ("02340002", "רשימה א"),
            ("02340003", "רשימה א"),
            ("02340004", "רשימה ב"),
        ],
    );
    assert_eq!(
        catalog.default_accumulate_bank(),
        Some("רשימה א".to_string())
    );
}

#[test]
fn test_default_accumulate_bank_no_accumulate_banks() {
    let catalog = make_catalog(
        "test",
        vec![("חובה", Rule::All)],
        vec![("02340001", "חובה")],
    );
    assert_eq!(catalog.default_accumulate_bank(), None);
}

#[test]
fn test_default_accumulate_bank_empty_catalog() {
    let catalog = Catalog::default();
    assert_eq!(catalog.default_accumulate_bank(), None);
}

// --- enrich_with_prefix_courses tests ---

#[test]
fn test_enrich_prefix_adds_non_catalog_course() {
    let mut catalog = make_catalog(
        "מדמח 2023",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![("02340001", "רשימה א")],
    );
    catalog.faculty = Faculty::ComputerScience;

    let student_courses = vec![
        make_course_status("02340001", 3.0), // already in catalog
        make_course_status("02340099", 3.0), // NOT in catalog, has CS prefix
    ];

    catalog.enrich_with_prefix_courses(&student_courses);

    assert_eq!(catalog.course_to_bank.len(), 2);
    assert_eq!(
        catalog.course_to_bank.get(&CourseId::new("02340099")),
        Some(&"רשימה א".to_string())
    );
}

#[test]
fn test_enrich_prefix_does_not_override_existing() {
    let mut catalog = make_catalog(
        "מדמח 2023",
        vec![("חובה", Rule::All), ("רשימה א", Rule::AccumulateCredit)],
        vec![
            ("02340001", "חובה"), // already mapped to חובה
            ("02340002", "רשימה א"),
            ("02340003", "רשימה א"),
        ],
    );
    catalog.faculty = Faculty::ComputerScience;

    let student_courses = vec![make_course_status("02340001", 3.0)];

    catalog.enrich_with_prefix_courses(&student_courses);

    // Should remain in חובה, not moved to רשימה א
    assert_eq!(
        catalog.course_to_bank.get(&CourseId::new("02340001")),
        Some(&"חובה".to_string())
    );
}

#[test]
fn test_enrich_prefix_no_prefixes_for_unknown_faculty() {
    let mut catalog = make_catalog(
        "test 2023",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![("02340001", "רשימה א")],
    );
    catalog.faculty = Faculty::Unknown;

    let student_courses = vec![make_course_status("02340099", 3.0)];

    catalog.enrich_with_prefix_courses(&student_courses);

    // Should NOT add the course since Unknown faculty has no prefixes
    assert_eq!(catalog.course_to_bank.len(), 1);
    assert!(!catalog
        .course_to_bank
        .contains_key(&CourseId::new("02340099")));
}

#[test]
fn test_enrich_prefix_no_accumulate_banks() {
    let mut catalog = make_catalog(
        "מדמח 2023",
        vec![("חובה", Rule::All)],
        vec![("02340001", "חובה")],
    );
    catalog.faculty = Faculty::ComputerScience;

    let student_courses = vec![make_course_status("02340099", 3.0)];

    catalog.enrich_with_prefix_courses(&student_courses);

    // Should NOT add since there's no accumulate bank
    assert_eq!(catalog.course_to_bank.len(), 1);
}

#[test]
fn test_enrich_prefix_multiple_prefixes() {
    let mut catalog = make_catalog(
        "מדמח 2023",
        vec![("רשימה א", Rule::AccumulateCredit)],
        vec![("02340001", "רשימה א")],
    );
    catalog.faculty = Faculty::ComputerScience;

    let student_courses = vec![
        make_course_status("02340099", 3.0), // prefix 0234
        make_course_status("02360055", 3.0), // prefix 0236
        make_course_status("09990001", 3.0), // non-matching prefix
    ];

    catalog.enrich_with_prefix_courses(&student_courses);

    assert_eq!(catalog.course_to_bank.len(), 3); // original + 2 matched
    assert!(catalog
        .course_to_bank
        .contains_key(&CourseId::new("02340099")));
    assert!(catalog
        .course_to_bank
        .contains_key(&CourseId::new("02360055")));
    assert!(!catalog
        .course_to_bank
        .contains_key(&CourseId::new("09990001")));
}
