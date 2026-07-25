use std::collections::HashMap;

use crate::{
    core::types::Rule,
    resources::{
        catalog::{Catalog, Faculty},
        course::*,
    },
};

use super::*;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn sem(year: i32) -> Option<AcademicSemester> {
    Some(AcademicSemester::new(SemesterSeason::Winter, year))
}

fn course_status(
    id: &str,
    credit: f32,
    grade: Option<Grade>,
    state: Option<CourseState>,
    semester: Option<AcademicSemester>,
) -> CourseStatus {
    CourseStatus {
        course: Course {
            id: CourseId::new(id),
            credit,
            name: id.to_string(),
            tags: None,
        },
        state,
        semester,
        grade,
        ..Default::default()
    }
}

fn graded(id: &str, grade: u32, year: i32) -> CourseStatus {
    course_status(
        id,
        3.0,
        Some(Grade::Numeric(grade)),
        Some(CourseState::Complete),
        sem(year),
    )
}

fn ungraded(id: &str, year: i32) -> CourseStatus {
    course_status(id, 3.0, None, Some(CourseState::InProgress), sem(year))
}

fn not_complete(id: &str, year: i32) -> CourseStatus {
    course_status(
        id,
        3.0,
        Some(Grade::NotComplete),
        Some(CourseState::NotComplete),
        sem(year),
    )
}

fn sport(id: &str, year: i32) -> CourseStatus {
    // Sport courses are 1-credit and identified by the Sport tag (not by id).
    let mut cs = course_status(
        id,
        1.0,
        Some(Grade::Numeric(90)),
        Some(CourseState::Complete),
        sem(year),
    );
    cs.course.tags = Some(vec![Tag::Sport]);
    cs
}

fn social(id: &str, year: i32) -> CourseStatus {
    let mut cs = graded(id, 90, year);
    cs.course.name = "פעילות חברתית".to_string();
    cs
}

/// Runs `extract_repetitions` and returns the surviving statuses together with the
/// removed (superseded) ones. The surviving statuses come out of a `HashMap`, so
/// callers must assert in an order-independent way.
fn extract(statuses: Vec<CourseStatus>) -> (Vec<CourseStatus>, Vec<CourseStatus>) {
    let mut degree_status = DegreeStatus {
        course_statuses: statuses,
        ..Default::default()
    };
    let removed = degree_status.extract_repetitions();
    (degree_status.course_statuses, removed)
}

fn count_id(statuses: &[CourseStatus], id: &str) -> usize {
    statuses.iter().filter(|cs| *cs.course.id == *id).count()
}

fn find<'a>(statuses: &'a [CourseStatus], id: &str) -> &'a CourseStatus {
    statuses
        .iter()
        .find(|cs| *cs.course.id == *id)
        .unwrap_or_else(|| panic!("course {id} not found"))
}

// ---------------------------------------------------------------------------
// extract_repetitions — unit tests
// ---------------------------------------------------------------------------

#[test]
fn no_duplicates_returns_empty_removed_and_keeps_all() {
    let (kept, removed) = extract(vec![
        graded("a", 80, 2021),
        graded("b", 70, 2022),
        graded("c", 90, 2023),
    ]);

    assert!(removed.is_empty());
    assert_eq!(kept.len(), 3);
    assert_eq!(count_id(&kept, "a"), 1);
    assert_eq!(count_id(&kept, "b"), 1);
    assert_eq!(count_id(&kept, "c"), 1);
}

#[test]
fn ungraded_existing_is_replaced_by_graded_attempt() {
    // The first attempt has no grade yet; a later graded attempt supersedes it.
    let (kept, removed) = extract(vec![ungraded("dup", 2022), graded("dup", 80, 2023)]);

    assert_eq!(kept.len(), 1);
    assert_eq!(find(&kept, "dup").grade, Some(Grade::Numeric(80)));
    assert_eq!(removed.len(), 1);
    assert!(removed[0].grade.is_none());
}

#[test]
fn graded_existing_is_kept_over_ungraded_attempt() {
    let (kept, removed) = extract(vec![graded("dup", 80, 2022), ungraded("dup", 2023)]);

    assert_eq!(kept.len(), 1);
    assert_eq!(find(&kept, "dup").grade, Some(Grade::Numeric(80)));
    assert_eq!(removed.len(), 1);
    assert!(removed[0].grade.is_none());
}

#[test]
fn not_complete_retake_does_not_replace_graded_attempt() {
    // Student retook the course but didn't finish it (לא השלים) in a later semester;
    // the earlier real grade must be kept even though the retake is more recent.
    let (kept, removed) = extract(vec![graded("dup", 80, 2022), not_complete("dup", 2023)]);

    assert_eq!(kept.len(), 1);
    assert_eq!(find(&kept, "dup").grade, Some(Grade::Numeric(80)));
    assert_eq!(removed.len(), 1);
    assert_eq!(removed[0].grade, Some(Grade::NotComplete));
}

#[test]
fn latest_semester_wins_when_both_attempts_are_graded() {
    // The later semester wins regardless of which grade is higher.
    let (kept, removed) = extract(vec![graded("dup", 90, 2022), graded("dup", 60, 2023)]);

    assert_eq!(kept.len(), 1);
    let kept_dup = find(&kept, "dup");
    assert_eq!(kept_dup.grade, Some(Grade::Numeric(60)));
    assert_eq!(kept_dup.semester, sem(2023));
    assert_eq!(removed.len(), 1);
    assert_eq!(removed[0].grade, Some(Grade::Numeric(90)));
}

#[test]
fn earlier_semester_attempt_is_removed_when_both_graded() {
    // Same as above but the newest attempt appears first in the list.
    let (kept, removed) = extract(vec![graded("dup", 60, 2023), graded("dup", 90, 2022)]);

    assert_eq!(kept.len(), 1);
    assert_eq!(find(&kept, "dup").grade, Some(Grade::Numeric(60)));
    assert_eq!(removed.len(), 1);
    assert_eq!(removed[0].grade, Some(Grade::Numeric(90)));
}

#[test]
fn three_attempts_keep_latest_and_remove_the_other_two() {
    let (kept, removed) = extract(vec![
        graded("dup", 70, 2021),
        graded("dup", 80, 2022),
        graded("dup", 60, 2023),
    ]);

    assert_eq!(kept.len(), 1);
    assert_eq!(find(&kept, "dup").grade, Some(Grade::Numeric(60))); // the 2023 attempt
    assert_eq!(removed.len(), 2);
    let removed_grades: Vec<_> = removed.iter().map(|cs| cs.grade).collect();
    assert!(removed_grades.contains(&Some(Grade::Numeric(70))));
    assert!(removed_grades.contains(&Some(Grade::Numeric(80))));
}

#[test]
fn sport_courses_with_same_id_are_all_kept() {
    // A student may take the same sport course id more than once (e.g. in different
    // semesters). Every attempt must be preserved: sport courses are exempt from the
    // repetition dedup and are never reported as repetitions.
    let (kept, removed) = extract(vec![sport("s1", 2022), sport("s1", 2023)]);

    assert!(removed.is_empty());
    assert_eq!(count_id(&kept, "s1"), 2);
    assert_eq!(kept.len(), 2);
}

#[test]
fn multiple_distinct_sport_courses_are_all_kept() {
    let (kept, removed) = extract(vec![
        sport("s1", 2022),
        sport("s2", 2022),
        sport("s3", 2023),
    ]);

    assert!(removed.is_empty());
    assert_eq!(kept.len(), 3);
}

#[test]
fn social_courses_with_same_id_are_all_kept() {
    // Social-activity courses ("פעילות חברתית") may also repeat and are exempt from
    // the dedup just like sport courses.
    let (kept, removed) = extract(vec![social("soc", 2022), social("soc", 2023)]);

    assert!(removed.is_empty());
    assert_eq!(count_id(&kept, "soc"), 2);
    assert_eq!(kept.len(), 2);
}

#[test]
fn only_the_duplicated_course_is_deduped_in_a_mixed_list() {
    let (kept, removed) = extract(vec![
        graded("a", 80, 2021),
        graded("dup", 55, 2021),
        graded("b", 75, 2022),
        graded("dup", 95, 2023),
    ]);

    // `a` and `b` are untouched; only `dup` collapses to its latest attempt.
    assert_eq!(kept.len(), 3);
    assert_eq!(count_id(&kept, "a"), 1);
    assert_eq!(count_id(&kept, "b"), 1);
    assert_eq!(count_id(&kept, "dup"), 1);
    assert_eq!(find(&kept, "dup").grade, Some(Grade::Numeric(95)));
    assert_eq!(removed.len(), 1);
    assert_eq!(removed[0].grade, Some(Grade::Numeric(55)));
}

// ---------------------------------------------------------------------------
// Repetitions through the full compute() flow (grade sheet with duplicates)
// ---------------------------------------------------------------------------

fn hova_catalog() -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: "catalog".to_string(), // no year in the name → English requirement is skipped
        faculty: Faculty::Unknown,
        total_credit: 0.0,
        description: String::new(),
        course_banks: vec![CourseBank {
            name: "hova".to_string(),
            rule: Rule::All,
            credit: Some(100.0),
        }],
        credit_overflows: vec![],
        course_to_bank: HashMap::from([
            (CourseId::new("dup"), "hova".to_string()),
            (CourseId::new("u1"), "hova".to_string()),
        ]),
        catalog_replacements: HashMap::new(),
        common_replacements: HashMap::new(),
    }
}

fn active_instances<'a>(degree_status: &'a DegreeStatus, id: &str) -> Vec<&'a CourseStatus> {
    degree_status
        .course_statuses
        .iter()
        .filter(|cs| *cs.course.id == *id && !cs.is_repetition)
        .collect()
}

fn repetition_instances<'a>(degree_status: &'a DegreeStatus, id: &str) -> Vec<&'a CourseStatus> {
    degree_status
        .course_statuses
        .iter()
        .filter(|cs| *cs.course.id == *id && cs.is_repetition)
        .collect()
}

#[test]
fn compute_keeps_latest_attempt_and_flags_the_superseded_one_as_repetition() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            course_status(
                "dup",
                3.0,
                Some(Grade::Numeric(50)),
                Some(CourseState::NotComplete),
                sem(2022),
            ),
            course_status(
                "dup",
                3.0,
                Some(Grade::Numeric(80)),
                Some(CourseState::Complete),
                sem(2023),
            ),
            course_status(
                "u1",
                4.0,
                Some(Grade::Numeric(90)),
                Some(CourseState::Complete),
                sem(2023),
            ),
        ],
        ..Default::default()
    };

    degree_status.compute(hova_catalog(), HashMap::new());

    // Both attempts survive the flow, but only one is active.
    assert_eq!(count_id(&degree_status.course_statuses, "dup"), 2);

    let active = active_instances(&degree_status, "dup");
    assert_eq!(active.len(), 1);
    assert_eq!(active[0].grade, Some(Grade::Numeric(80)));

    let repetitions = repetition_instances(&degree_status, "dup");
    assert_eq!(repetitions.len(), 1);
    assert_eq!(repetitions[0].grade, Some(Grade::Numeric(50)));

    // The duplicated course is counted once (3.0), plus u1 (4.0) — never doubled.
    assert_eq!(degree_status.total_credit, 7.0);
}

#[test]
fn compute_keeps_passing_grade_when_retake_was_not_completed() {
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            course_status(
                "dup",
                3.0,
                Some(Grade::Numeric(75)),
                Some(CourseState::Complete),
                sem(2022),
            ),
            course_status(
                "dup",
                3.0,
                Some(Grade::NotComplete),
                Some(CourseState::NotComplete),
                sem(2023),
            ),
            course_status(
                "u1",
                4.0,
                Some(Grade::Numeric(90)),
                Some(CourseState::Complete),
                sem(2023),
            ),
        ],
        ..Default::default()
    };

    degree_status.compute(hova_catalog(), HashMap::new());

    let active = active_instances(&degree_status, "dup");
    assert_eq!(active.len(), 1);
    assert_eq!(active[0].grade, Some(Grade::Numeric(75)));
    assert!(active[0].completed());

    let repetitions = repetition_instances(&degree_status, "dup");
    assert_eq!(repetitions.len(), 1);
    assert_eq!(repetitions[0].grade, Some(Grade::NotComplete));

    // Only the passing earlier attempt (3.0) and u1 (4.0) count toward the total.
    assert_eq!(degree_status.total_credit, 7.0);
}

#[test]
fn compute_takes_latest_failed_attempt_and_marks_course_incomplete() {
    // The student passed the course first, then retook it and failed. The latest
    // (failed) attempt is the authoritative one, so the course counts as NOT
    // completed and the earlier pass becomes the repetition.
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            course_status(
                "dup",
                3.0,
                Some(Grade::Numeric(80)),
                Some(CourseState::Complete),
                sem(2022),
            ),
            course_status(
                "dup",
                3.0,
                Some(Grade::Numeric(50)),
                Some(CourseState::NotComplete),
                sem(2023),
            ),
            course_status(
                "u1",
                4.0,
                Some(Grade::Numeric(90)),
                Some(CourseState::Complete),
                sem(2023),
            ),
        ],
        ..Default::default()
    };

    degree_status.compute(hova_catalog(), HashMap::new());

    // The latest (failed) attempt is the active one, so the course is not completed.
    let active = active_instances(&degree_status, "dup");
    assert_eq!(active.len(), 1);
    assert_eq!(active[0].grade, Some(Grade::Numeric(50)));
    assert!(!active[0].completed());
    assert!(active[0].not_completed());

    // The earlier passing attempt is preserved as a repetition.
    let repetitions = repetition_instances(&degree_status, "dup");
    assert_eq!(repetitions.len(), 1);
    assert_eq!(repetitions[0].grade, Some(Grade::Numeric(80)));

    // The failed course contributes no credit; only u1 (4.0) counts.
    assert_eq!(degree_status.total_credit, 4.0);
}

fn sport_catalog() -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: "catalog".to_string(), // no year → English requirement is skipped
        faculty: Faculty::Unknown,
        total_credit: 0.0,
        description: String::new(),
        course_banks: vec![CourseBank {
            name: "sport".to_string(),
            rule: Rule::Sport,
            credit: Some(2.0),
        }],
        credit_overflows: vec![],
        course_to_bank: HashMap::new(),
        catalog_replacements: HashMap::new(),
        common_replacements: HashMap::new(),
    }
}

#[test]
fn compute_keeps_all_same_id_sport_courses_and_counts_each_one() {
    // Regression test for the sport-duplication bug: two attempts of the same sport
    // course id must both survive compute() — previously the id-keyed dedup map
    // silently dropped the older one — and both must count toward the sport bank.
    let mut degree_status = DegreeStatus {
        course_statuses: vec![sport("0394001", 2022), sport("0394001", 2023)],
        ..Default::default()
    };

    degree_status.compute(sport_catalog(), HashMap::new());

    assert_eq!(count_id(&degree_status.course_statuses, "0394001"), 2);
    assert!(degree_status
        .course_statuses
        .iter()
        .all(|course_status| !course_status.is_repetition));
    // Both 1.0-credit sport attempts are counted (2.0), matching the bank credit.
    assert_eq!(degree_status.total_credit, 2.0);
}
