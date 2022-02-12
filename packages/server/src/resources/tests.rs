use actix_rt::test;
use serde_json::json;

use super::course::{CourseState, Grade};

#[test]
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

    let err: Result<CourseState, _> = serde_json::from_str("השלים");
    assert!(err.is_err());
}

#[test]
async fn test_course_grade_serde() {
    let course_grades = vec![
        Grade::Numeric(95),
        Grade::Binary(true),
        Grade::ExemptionWithoutCredit,
        Grade::ExemptionWithCredit,
        Grade::NotComplete,
    ];
    let json = json!(course_grades);
    assert_eq!(
        json,
        json!(["95", "עבר", "פטור ללא ניקוד", "פטור עם ניקוד", "לא השלים"])
    );

    let vec: Vec<Grade> = serde_json::from_value(json).expect("Fail to deserialize");
    assert_eq!(vec, course_grades);

    let err: Result<Grade, _> = serde_json::from_str("-");
    assert!(err.is_err());
}
