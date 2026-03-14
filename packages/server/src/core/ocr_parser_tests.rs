use super::*;

#[test]
fn test_clean_course_name() {
    assert_eq!(clean_course_name("מערכות ספרתיות ומבנה המחשב"), "מערכות ספרתיות ומבנה המחשב");
    assert_eq!(clean_course_name("  חשבון אינפיניטסימלי 1מ'  "), "חשבון אינפיניטסימלי 1מ'");
    assert_eq!(clean_course_name("2 מערכות ספרתיות"), "מערכות ספרתיות");
}

#[test]
fn test_parse_data_line_numeric_grade() {
    let (name, credit, grade) = parse_data_line("אלגוריתמים 1 3 82");
    assert_eq!(grade, Some(Grade::Numeric(82)));
    assert!(credit == 3.0 || name.contains("אלגוריתמים"));
}

#[test]
fn test_parse_data_line_word_grade() {
    let (name, credit, grade) = parse_data_line("הסתברות מ 4 עובר");
    assert_eq!(grade, Some(Grade::Binary(true)));
    assert!(name.contains("הסתברות"));
}

#[test]
fn test_parse_data_line_exemption() {
    let (_name, _credit, grade) = parse_data_line("השלמות מתמטיקה פטור ללא ניקוד");
    assert_eq!(grade, Some(Grade::ExemptionWithoutCredit));
}

#[test]
fn test_parse_data_line_exemption_with_credit() {
    let (_name, _credit, grade) = parse_data_line("אנגלית טכנית-מתקדמים ב' 3 פטור עם ניקוד");
    assert_eq!(grade, Some(Grade::ExemptionWithCredit));
}

#[test]
fn test_parse_data_line_decimal_credit() {
    let (name, credit, grade) = parse_data_line("חשבון אינפיניטסימלי 1מ' 5.5 עובר");
    assert_eq!(grade, Some(Grade::Binary(true)));
    assert!((credit - 5.5).abs() < 0.01);
    assert!(name.contains("חשבון אינפיניטסימלי"));
}

#[test]
fn test_parse_raw_semester_winter() {
    let (season, year) = parse_raw_semester("4 חורף תשפ\"ד");
    assert_eq!(season, "חורף");
    assert_eq!(year, 'ד');
}

#[test]
fn test_parse_raw_semester_garbled_spring() {
    let (season, year) = parse_raw_semester("3 אצאביב תשפ\"ג");
    assert_eq!(season, "אביב");
    assert_eq!(year, 'ג');
}

#[test]
fn test_parse_raw_semester_summer() {
    let (season, year) = parse_raw_semester("5 קיץ תשפ\"ה");
    assert_eq!(season, "קיץ");
    assert_eq!(year, 'ה');
}

#[test]
fn test_parse_raw_semester_wan_pattern() {
    let (season, year) = parse_raw_semester("WAN 2022-2023 תשפ\"ג");
    assert_eq!(season, "חורף"); // WAN defaults to winter
    assert_eq!(year, 'ג');
}

#[test]
fn test_build_semester_map() {
    let semesters = vec![
        ("חורף".to_string(), 'ג'),
        ("אביב".to_string(), 'ג'),
        ("חורף".to_string(), 'ד'),
        ("קיץ".to_string(), 'ד'),
        ("חורף".to_string(), 'ה'),
    ];
    let map = build_semester_map(&semesters);
    assert_eq!(map[&("חורף".to_string(), 'ג')], "חורף_1");
    assert_eq!(map[&("אביב".to_string(), 'ג')], "אביב_2");
    assert_eq!(map[&("חורף".to_string(), 'ד')], "חורף_3");
    assert_eq!(map[&("קיץ".to_string(), 'ד')], "קיץ_3.5");
    assert_eq!(map[&("חורף".to_string(), 'ה')], "חורף_4.5");
}

#[test]
fn test_extract_semester_lines() {
    let text = "מקצוע\ndata line\nניקוד ציון\nאלגוריתמים 1 3 82\n4 חורף תשפ\"ד\n5 אצאביב תשפ\"ה\nחיפה, 01.01.2026";
    let semesters = extract_semester_lines(text);
    assert_eq!(semesters.len(), 2);
    assert!(semesters[0].contains("חורף"));
    assert!(semesters[1].contains("אביב") || semesters[1].contains("אצאביב"));
}

#[test]
fn test_is_semester_line() {
    assert!(is_semester_line("4 חורף תשפ\"ד"));
    assert!(is_semester_line("WAN 2022-2023 תשפ\"ג"));
    assert!(!is_semester_line("אלגוריתמים 1 3 82"));
    assert!(!is_semester_line("חיפה, 01.01.2026"));
}

#[test]
fn test_course_id_regex() {
    let text = "מקצוע00440252\n00940412\n01040031";
    let ids: Vec<String> = COURSE_ID_RE
        .find_iter(text)
        .filter(|m| m.as_str().len() == 8)
        .map(|m| m.as_str().to_string())
        .collect();
    assert_eq!(ids, vec!["00440252", "00940412", "01040031"]);
}

#[test]
fn test_course_id_8_digits() {
    let ids: Vec<String> = COURSE_ID_RE
        .find_iter("02340118 and 00440252 but not 123456 or 123456789")
        .filter(|m| m.as_str().len() == 8)
        .map(|m| m.as_str().to_string())
        .collect();
    assert_eq!(ids, vec!["02340118", "00440252"]);
}

#[test]
fn test_extract_data_lines_basic() {
    let text = "מקצוע\n00440252\nניקוד ציון\nאלגוריתמים 1 3 82\nמערכות הפעלה 4.5 86\n4 חורף תשפ\"ד";
    let data = extract_data_lines(text);
    assert_eq!(data.len(), 2);
    assert_eq!(data[0].2, Some(Grade::Numeric(82)));
    assert_eq!(data[1].2, Some(Grade::Numeric(86)));
}

/// Integration test: runs the full OCR pipeline on the example PDF.
/// Requires Tesseract OCR and Poppler (pdftoppm) to be installed.
#[test]
fn test_parse_pdf_ocr_integration() {
    let pdf_path = r"C:\Users\liadaram\OneDrive - Microsoft\Desktop\Home\Sogrim\gradesNewFormat.pdf";
    if !std::path::Path::new(pdf_path).exists() {
        eprintln!("Skipping integration test: example PDF not found at {pdf_path}");
        return;
    }

    let pdf_bytes = std::fs::read(pdf_path).expect("Failed to read example PDF");
    let courses = parse_pdf_ocr(&pdf_bytes).expect("parse_pdf_ocr should succeed");

    // The example PDF should have courses
    assert!(!courses.is_empty(), "Should extract at least some courses");
    eprintln!("Extracted {} courses", courses.len());

    // All course IDs should be 8 digits
    for cs in &courses {
        assert_eq!(
            cs.course.id.len(),
            8,
            "Course ID '{}' should be 8 digits (course: {})",
            cs.course.id,
            cs.course.name
        );
        assert!(
            cs.course.id.chars().all(|c| c.is_ascii_digit()),
            "Course ID '{}' should be all digits",
            cs.course.id
        );
    }

    // All courses should have a semester
    for cs in &courses {
        assert!(
            cs.semester.is_some(),
            "Course '{}' should have a semester",
            cs.course.id
        );
    }

    // Semesters should NOT all be the same (regression check)
    let unique_semesters: std::collections::HashSet<_> =
        courses.iter().filter_map(|c| c.semester.as_ref()).collect();
    assert!(
        unique_semesters.len() > 1,
        "Expected multiple unique semesters, got {:?}",
        unique_semesters
    );

    // Print extracted courses for manual inspection
    for cs in &courses {
        eprintln!(
            "  {} | {:20} | credit={:.1} | grade={:?} | semester={:?}",
            cs.course.id,
            cs.course.name,
            cs.course.credit,
            cs.grade,
            cs.semester,
        );
    }
}
