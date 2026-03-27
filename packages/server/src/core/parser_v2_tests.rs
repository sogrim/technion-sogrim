use super::*;
use crate::resources::course::CourseState;

fn get_chrome_data() -> String {
    std::fs::read_to_string(
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("docs")
            .join("grade_sheet_new_format_chrome.txt"),
    )
    .expect("Failed to read Chrome grade sheet test file")
}

fn get_edge_data() -> String {
    std::fs::read_to_string(
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("docs")
            .join("grade_sheet_new_format_edge.txt"),
    )
    .expect("Failed to read Edge grade sheet test file")
}

#[test]
fn chrome_parses_successfully() {
    let data = get_chrome_data();
    let result = parse_copy_paste_data(&data);
    assert!(result.is_ok(), "Chrome parsing failed: {:?}", result.err());
    let courses = result.unwrap();
    assert!(!courses.is_empty());
}

#[test]
fn edge_parses_successfully() {
    let data = get_edge_data();
    let result = parse_copy_paste_data(&data);
    assert!(result.is_ok(), "Edge parsing failed: {:?}", result.err());
    let courses = result.unwrap();
    assert!(!courses.is_empty());
}

#[test]
fn chrome_uses_8_digit_course_ids() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    for cs in &courses {
        assert_eq!(
            cs.course.id.len(),
            8,
            "Course ID '{}' is not 8 digits",
            cs.course.id
        );
    }
}

#[test]
fn edge_uses_8_digit_course_ids() {
    let data = get_edge_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    for cs in &courses {
        assert_eq!(
            cs.course.id.len(),
            8,
            "Course ID '{}' is not 8 digits",
            cs.course.id
        );
    }
}

fn find_course<'a>(courses: &'a [CourseStatus], id: &str) -> Option<&'a CourseStatus> {
    courses.iter().find(|cs| cs.course.id == id)
}

#[test]
fn chrome_parses_numeric_grade() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "00440252").expect("Course 00440252 not found");
    assert_eq!(cs.grade, Some(Grade::Numeric(90)));
    assert_eq!(cs.course.credit, 5.0);
    assert_eq!(cs.state, Some(CourseState::Complete));
}

#[test]
fn chrome_parses_binary_grade() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "00940412").expect("Course 00940412 not found");
    assert_eq!(cs.grade, Some(Grade::Binary(true)));
    assert_eq!(cs.course.credit, 4.0);
}

#[test]
fn chrome_parses_exemption_without_credit() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "01030015").expect("Course 01030015 not found");
    assert_eq!(cs.grade, Some(Grade::ExemptionWithoutCredit));
}

#[test]
fn chrome_exemption_without_credit_has_zero_credit() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    // עברית 4 has פטור ללא ניקוד → credit must be 0, "4" is part of the name
    let cs = find_course(&courses, "03240053").expect("Course 03240053 not found");
    assert_eq!(cs.grade, Some(Grade::ExemptionWithoutCredit));
    assert_eq!(cs.course.credit, 0.0);
}

#[test]
fn edge_exemption_without_credit_has_zero_credit() {
    let data = get_edge_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "03240053").expect("Course 03240053 not found");
    assert_eq!(cs.grade, Some(Grade::ExemptionWithoutCredit));
    assert_eq!(cs.course.credit, 0.0);
}

#[test]
fn chrome_parses_exemption_with_credit() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "03240033").expect("Course 03240033 not found");
    assert_eq!(cs.grade, Some(Grade::ExemptionWithCredit));
    assert_eq!(cs.course.credit, 3.0);
}

#[test]
fn chrome_parses_decimal_credit() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "01040031").expect("Course 01040031 not found");
    assert_eq!(cs.course.credit, 5.5);
    assert_eq!(cs.grade, Some(Grade::Binary(true)));
}

#[test]
fn chrome_parses_sport_courses_with_duplicates() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let sport: Vec<_> = courses
        .iter()
        .filter(|cs| cs.course.id.starts_with("0394"))
        .collect();
    // Should have multiple sport courses, including duplicate 03940803
    assert!(sport.len() >= 4, "Expected at least 4 sport courses");
    let duplicates: Vec<_> = sport
        .iter()
        .filter(|cs| cs.course.id == "03940803")
        .collect();
    assert_eq!(duplicates.len(), 2, "Expected 2 instances of 03940803");
}

#[test]
fn chrome_assigns_semester_numbers() {
    let data = get_chrome_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    for cs in &courses {
        assert!(
            cs.semester.is_some(),
            "Course {} has no semester",
            cs.course.id
        );
        let sem = cs.semester.as_ref().unwrap();
        assert!(
            sem.contains('_'),
            "Semester '{}' for course {} missing underscore separator",
            sem,
            cs.course.id
        );
    }
}

#[test]
fn chrome_invalid_data_returns_error() {
    let result = parse_copy_paste_data("invalid data");
    assert!(result.is_err());
}

// Edge-specific tests

#[test]
fn edge_parses_numeric_grade() {
    let data = get_edge_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "00440252").expect("Course 00440252 not found");
    assert_eq!(cs.grade, Some(Grade::Numeric(90)));
    assert_eq!(cs.course.credit, 5.0);
}

#[test]
fn edge_parses_binary_grade() {
    let data = get_edge_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "00940412").expect("Course 00940412 not found");
    assert_eq!(cs.grade, Some(Grade::Binary(true)));
    assert_eq!(cs.course.credit, 4.0);
}

#[test]
fn edge_parses_exemption_without_credit() {
    let data = get_edge_data();
    let courses = parse_copy_paste_data(&data).unwrap();
    let cs = find_course(&courses, "01030015").expect("Course 01030015 not found");
    assert_eq!(cs.grade, Some(Grade::ExemptionWithoutCredit));
}

// Cross-format consistency tests

#[test]
fn both_formats_produce_same_course_ids() {
    let chrome_data = get_chrome_data();
    let edge_data = get_edge_data();
    let chrome_courses = parse_copy_paste_data(&chrome_data).unwrap();
    let edge_courses = parse_copy_paste_data(&edge_data).unwrap();

    let mut chrome_ids: Vec<_> = chrome_courses
        .iter()
        .map(|cs| cs.course.id.clone())
        .collect();
    let mut edge_ids: Vec<_> = edge_courses.iter().map(|cs| cs.course.id.clone()).collect();
    chrome_ids.sort();
    edge_ids.sort();

    assert_eq!(
        chrome_ids, edge_ids,
        "Chrome and Edge should produce the same set of course IDs"
    );
}

#[test]
fn both_formats_produce_same_grades() {
    let chrome_data = get_chrome_data();
    let edge_data = get_edge_data();
    let chrome_courses = parse_copy_paste_data(&chrome_data).unwrap();
    let edge_courses = parse_copy_paste_data(&edge_data).unwrap();

    // Exclude sport courses (0394*) which can have duplicates with different grades
    let chrome_map: HashMap<_, _> = chrome_courses
        .iter()
        .filter(|cs| !cs.course.id.starts_with("0394"))
        .map(|cs| (cs.course.id.clone(), cs.grade))
        .collect();

    for edge_cs in edge_courses
        .iter()
        .filter(|cs| !cs.course.id.starts_with("0394"))
    {
        if let Some(chrome_grade) = chrome_map.get(&edge_cs.course.id) {
            assert_eq!(
                *chrome_grade, edge_cs.grade,
                "Grade mismatch for course {}: Chrome={:?}, Edge={:?}",
                edge_cs.course.id, chrome_grade, edge_cs.grade
            );
        }
    }
}
