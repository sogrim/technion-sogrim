use crate::resources::course::{AcademicSemester, CourseId, CourseState, SemesterSeason};

use super::*;

fn cs(id: &str, grade: Grade, semester: AcademicSemester) -> CourseStatus {
    let mut course_status = CourseStatus {
        course: Course {
            id: CourseId::new(id),
            credit: 1.0,
            name: id.to_string(),
            tags: None,
        },
        grade: Some(grade),
        semester: Some(semester),
        ..Default::default()
    };
    course_status.set_state();
    course_status
}

#[test]
fn set_grades_for_uncompleted_courses_prefers_latest_non_notcomplete_attempt() {
    let mut courses = vec![cs(
        "234111",
        Grade::NotComplete,
        AcademicSemester::new(SemesterSeason::Winter, 2026),
    )];
    let asterisk_courses = vec![
        cs(
            "234111",
            Grade::Numeric(82),
            AcademicSemester::new(SemesterSeason::Winter, 2024),
        ),
        cs(
            "234111",
            Grade::NotComplete,
            AcademicSemester::new(SemesterSeason::Spring, 2025),
        ),
        cs(
            "234111",
            Grade::Numeric(91),
            AcademicSemester::new(SemesterSeason::Winter, 2025),
        ),
    ];

    set_grades_for_uncompleted_courses(&mut courses, &asterisk_courses);

    assert_eq!(courses[0].grade, Some(Grade::Numeric(91)));
    assert_eq!(courses[0].state, Some(CourseState::Complete));
}

#[test]
fn parse_course_status_handles_not_complete_m_variant() {
    let line = "234111 3.0 לא השלים(מ) מבני נתונים";

    let (course, grade) = parse_course_status_pdf_format(line, false, false).unwrap();

    assert_eq!(*course.id, *"02340111");
    assert_eq!(course.credit, 3.0);
    assert_eq!(course.name, "(מ) מבני נתונים");
    assert_eq!(grade, Some(Grade::NotComplete));
}

#[test]
fn parse_course_status_reverses_course_name_for_medicine_firefox_format() {
    let line = "234111 3.0 87 networks distributed";

    let (course, grade) = parse_course_status_pdf_format(line, false, true).unwrap();

    assert_eq!(course.name, "distributed networks");
    assert_eq!(grade, Some(Grade::Numeric(87)));
}
