use regex::Regex;
use std::sync::LazyLock;

use crate::{
    error::AppError,
    resources::course::{Course, CourseId, CourseStatus, Grade},
};
use std::collections::HashMap;

// 8 digits not preceded or followed by another digit.
static COURSE_ID_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?:^|\D)(\d{8})(?:\D|$)").unwrap());
static SEMESTER_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(\d{4}-\d{4})\s+(אביב|חורף|קיץ)\s+(תש\S+)").unwrap());
static NUMBER_RE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\b(\d+\.?\d*)\b").unwrap());

// ── Format Detection ──

enum Format {
    Chrome,
    Edge,
}

impl Format {
    fn detect(data: &str) -> Self {
        if data.contains("מקצוע ניקוד ציון סמסטר") {
            Format::Chrome
        } else {
            Format::Edge
        }
    }
}

fn validate(data: &str) -> Result<(), AppError> {
    if !(data.contains("תעודת ציונים") && data.contains("סוף תעודת")) {
        return Err(AppError::Parser("Invalid copy paste data".into()));
    }
    Ok(())
}

// ── Grade Parsing ──

/// Ordered longest-first so multi-word terms match before substrings.
const HEBREW_GRADES: &[&str] = &[
    "פטור ללא ניקוד",
    "פטור עם ניקוד",
    "לא השלים(מ)",
    "לא השלים",
    "עובר",
    "עבר",
    "נכשל",
    "פטור",
];

fn to_grade(s: &str) -> Option<Grade> {
    match s.trim() {
        "פטור ללא ניקוד" => Some(Grade::ExemptionWithoutCredit),
        "פטור עם ניקוד" => Some(Grade::ExemptionWithCredit),
        "פטור" => Some(Grade::ExemptionWithCredit),
        "עובר" | "עבר" => Some(Grade::Binary(true)),
        "נכשל" => Some(Grade::Binary(false)),
        "לא השלים" | "לא השלים(מ)" => Some(Grade::NotComplete),
        s => s.parse::<u32>().ok().map(Grade::Numeric),
    }
}

// ── Number Helpers ──

fn pop_right_number(text: &str) -> (String, Option<String>) {
    let mut last = None;
    for m in NUMBER_RE.find_iter(text) {
        last = Some((m.start(), m.end(), m.as_str().to_string()));
    }
    match last {
        Some((s, e, val)) => {
            let rest = format!("{}{}", &text[..s], &text[e..]);
            (rest.trim().to_string(), Some(val))
        }
        None => (text.to_string(), None),
    }
}

fn pop_left_number(text: &str) -> (String, Option<String>) {
    match NUMBER_RE.find(text) {
        Some(m) => {
            let rest = format!("{}{}", &text[..m.start()], &text[m.end()..]);
            (rest.trim().to_string(), Some(m.as_str().to_string()))
        }
        None => (text.to_string(), None),
    }
}

// ── Data Field Parsing ──

/// Chrome data: NAME [CREDIT] [GRADE] — parse right to left.
/// If grade is פטור ללא ניקוד, credit is always 0.
fn parse_chrome_fields(data: &str) -> (String, f32, Option<Grade>) {
    let data = data.trim();
    if data.is_empty() {
        return (String::new(), 0.0, None);
    }
    // Try Hebrew grade at end
    for &term in HEBREW_GRADES {
        if let Some(rest) = data.strip_suffix(term) {
            let rest = rest.trim();
            let grade = to_grade(term);
            if matches!(grade, Some(Grade::ExemptionWithoutCredit)) {
                return (rest.to_string(), 0.0, grade);
            }
            let (name, cs) = pop_right_number(rest);
            return (name, cs.and_then(|s| s.parse().ok()).unwrap_or(0.0), grade);
        }
    }
    // Numeric grade: rightmost number
    let (rest, gs) = pop_right_number(data);
    let grade = gs.and_then(|s| to_grade(&s));
    let (name, cs) = pop_right_number(&rest);
    (name, cs.and_then(|s| s.parse().ok()).unwrap_or(0.0), grade)
}

/// Edge data: [GRADE] [CREDIT] NAME — parse left to right.
/// If grade is פטור ללא ניקוד, credit is always 0.
fn parse_edge_fields(data: &str) -> (String, f32, Option<Grade>) {
    let data = data.trim();
    if data.is_empty() {
        return (String::new(), 0.0, None);
    }
    // Try Hebrew grade at start
    for &term in HEBREW_GRADES {
        if let Some(rest) = data.strip_prefix(term) {
            let rest = rest.trim();
            let grade = to_grade(term);
            if matches!(grade, Some(Grade::ExemptionWithoutCredit)) {
                return (rest.to_string(), 0.0, grade);
            }
            let (name, cs) = pop_left_number(rest);
            return (name, cs.and_then(|s| s.parse().ok()).unwrap_or(0.0), grade);
        }
    }
    // Numeric grade: leftmost number
    let (rest, gs) = pop_left_number(data);
    let grade = gs.and_then(|s| to_grade(&s));
    let (name, cs) = pop_left_number(&rest);
    (name, cs.and_then(|s| s.parse().ok()).unwrap_or(0.0), grade)
}

// ── Helpers ──

struct RawCourse {
    id: String,
    name: String,
    credit: f32,
    grade: Option<Grade>,
    semester_year: String,
    semester_term: String,
}

/// Extract the first standalone 8-digit course ID from text.
fn extract_id(text: &str) -> Option<String> {
    COURSE_ID_RE.captures(text).map(|cap| cap[1].to_string())
}

/// Extract the first semester (year, term) from text.
fn extract_semester(text: &str) -> Option<(String, String)> {
    SEMESTER_RE
        .captures(text)
        .map(|cap| (cap[1].to_string(), cap[2].to_string()))
}

fn count_semesters(text: &str) -> usize {
    SEMESTER_RE.find_iter(text).count()
}

fn is_header_or_meta(line: &str) -> bool {
    let l = line.trim();
    l.is_empty()
        || l.contains("תעודת ציונים")
        || (l.contains("סמסטר") && l.contains("ציון"))
        || l.contains("ציון מעבר")
        || l.contains("סולם ציונים")
        || l.contains("עמוד") && l.contains("מתוך")
        || l.contains("הלומד")
        || l.contains("לתואר")
        || l.contains("בפקולטה")
        || l.contains("וצבר")
        || l.contains("סוף תעודת")
        || l.contains("הנני מאשר")
        || l.contains("מזכיר")
        || l.starts_with("דר'")
        || (l.contains("הקורס ניתן") && l.contains("E"))
}

// ── Chrome: Row-by-Row ──

/// Parse a Chrome record by extracting the ID and semester, removing them,
/// and parsing the remaining text as NAME [CREDIT] [GRADE].
fn parse_chrome_record(text: &str) -> Option<RawCourse> {
    let id = extract_id(text)?;
    let (year, term) = extract_semester(text)?;

    // Remove ID, semester, and (E) marker — remainder is name/credit/grade
    let data = text.replacen(&id, "", 1);
    let data = SEMESTER_RE.replace(&data, "").to_string();
    let data = data
        .replace("(E (", "")
        .replace("(E(", "")
        .replace("( E(", "");

    let (name, credit, grade) = parse_chrome_fields(data.trim());

    Some(RawCourse {
        id,
        name,
        credit,
        grade,
        semester_year: year,
        semester_term: term,
    })
}

fn parse_chrome_lines(lines: &[&str]) -> Result<Vec<RawCourse>, AppError> {
    let mut courses = Vec::new();
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i].trim();
        if is_header_or_meta(line) || extract_id(line).is_none() {
            i += 1;
            continue;
        }
        // Try single line
        if let Some(course) = parse_chrome_record(line) {
            courses.push(course);
            i += 1;
            continue;
        }
        // Try combining with next line
        if i + 1 < lines.len() {
            let combined = format!("{} {}", line, lines[i + 1]);
            if let Some(course) = parse_chrome_record(&combined) {
                courses.push(course);
                i += 2;
                continue;
            }
        }
        i += 1;
    }
    Ok(courses)
}

// ── Edge: Row-by-Row with Pending Course ──

fn parse_edge_lines(lines: &[&str]) -> Result<Vec<RawCourse>, AppError> {
    let mut courses = Vec::new();
    let mut pending: Option<RawCourse> = None;

    for line in lines {
        let line = line.trim();

        // Resolve pending course: first ID on this line belongs to the previous course
        let mut used_id_for_pending = false;
        if pending.is_some() && !line.contains("(E)") {
            if let Some(id) = extract_id(line) {
                let mut p = pending.take().unwrap();
                p.id = id;
                courses.push(p);
                used_id_for_pending = true;
            }
        }

        if is_header_or_meta(line) {
            continue;
        }

        let sem_count = count_semesters(line);
        if sem_count == 0 {
            continue;
        }

        if sem_count >= 2 {
            // (E) course line: ID (E) [name_suffix] SEM1 data SEM2 data
            let sem1_text = SEMESTER_RE.find(line).unwrap().as_str();
            let (prefix, after_sem1) = line.split_once(sem1_text).unwrap();
            let (year1, term1) = extract_semester(sem1_text).unwrap();

            let sem2_text = SEMESTER_RE.find(after_sem1).unwrap().as_str();
            let (data1, data2) = after_sem1.split_once(sem2_text).unwrap();
            let (year2, term2) = extract_semester(sem2_text).unwrap();

            // First course: (E) course with ID from prefix
            let e_id = extract_id(prefix).unwrap_or_default();
            let name_suffix = prefix
                .replacen(&e_id, "", 1)
                .replace("(E)", "")
                .trim()
                .to_string();

            let (mut name1, credit1, grade1) = parse_edge_fields(data1.trim());
            if !name_suffix.is_empty() {
                name1 = format!("{name1} {name_suffix}");
            }
            courses.push(RawCourse {
                id: e_id,
                name: name1,
                credit: credit1,
                grade: grade1,
                semester_year: year1,
                semester_term: term1,
            });

            // Second course: becomes pending (ID on next line)
            let (name2, credit2, grade2) = parse_edge_fields(data2.trim());
            pending = Some(RawCourse {
                id: String::new(),
                name: name2,
                credit: credit2,
                grade: grade2,
                semester_year: year2,
                semester_term: term2,
            });
            continue;
        }

        // Single-semester line: split on the semester
        let sem_text = SEMESTER_RE.find(line).unwrap().as_str();
        let (_before, after) = line.split_once(sem_text).unwrap();
        let (year, term) = extract_semester(sem_text).unwrap();

        // Look for course ID in the data after the semester
        let id = if !used_id_for_pending {
            extract_id(after)
        } else {
            None
        };
        let data = match &id {
            Some(id) => after.replacen(id, "", 1),
            None => after.to_string(),
        };

        // If no ID in data and no pending was resolved, check prefix
        let id = id.or_else(|| {
            if !used_id_for_pending {
                extract_id(_before)
            } else {
                None
            }
        });

        let (name, credit, grade) = parse_edge_fields(data.trim());

        let course = RawCourse {
            id: id.unwrap_or_default(),
            name,
            credit,
            grade,
            semester_year: year,
            semester_term: term,
        };

        if course.id.is_empty() {
            pending = Some(course);
        } else {
            courses.push(course);
        }
    }
    Ok(courses)
}

// ── Semester Numbering ──

fn semester_sort_key(year: &str, term: &str) -> (i32, i32) {
    let start_year = year
        .split('-')
        .next()
        .and_then(|y| y.parse::<i32>().ok())
        .unwrap_or(0);
    let term_order = match term {
        "חורף" => 0,
        "אביב" => 1,
        "קיץ" => 2,
        _ => 3,
    };
    (start_year, term_order)
}

/// Build a mapping from (year, term) to semester display string using
/// the year-range format (e.g. "חורף_2022-2023") so the frontend timeline
/// can place semesters at their actual calendar positions.
fn build_semester_map(raw_courses: &[RawCourse]) -> HashMap<(String, String), String> {
    let mut unique_semesters: Vec<(String, String)> = raw_courses
        .iter()
        .map(|c| (c.semester_year.clone(), c.semester_term.clone()))
        .collect();
    unique_semesters.sort_by_key(|a| semester_sort_key(&a.0, &a.1));
    unique_semesters.dedup();

    let mut semester_map = HashMap::new();

    for (year, term) in &unique_semesters {
        semester_map.insert((year.clone(), term.clone()), format!("{term}_{year}"));
    }

    semester_map
}

fn assign_semester_numbers(raw_courses: Vec<RawCourse>) -> Result<Vec<CourseStatus>, AppError> {
    let semester_map = build_semester_map(&raw_courses);

    let mut result = Vec::<CourseStatus>::new();

    for raw in raw_courses {
        let semester = semester_map
            .get(&(raw.semester_year, raw.semester_term))
            .cloned();

        // 0-credit exemptions (פטור ללא ניקוד) should have no semester,
        // so they are not picked up by bank rules (e.g. elective).
        let is_zero_credit_exemption =
            raw.credit == 0.0 && matches!(raw.grade, Some(Grade::ExemptionWithoutCredit));

        let mut cs = CourseStatus {
            course: Course {
                id: CourseId::new(raw.id),
                credit: raw.credit,
                name: raw.name,
                tags: None,
            },
            semester: if is_zero_credit_exemption {
                None
            } else {
                semester
            },
            grade: raw.grade,
            ..Default::default()
        };
        cs.set_state();
        // "פעילות חברתית" courses grant reserved credits — move them to פטורים וזיכויים
        if cs.course.name.contains("פעילות חברתית") {
            cs.semester = None;
        }
        result.push(cs);
    }

    Ok(result)
}

// ── Entry Point ──

pub fn parse_copy_paste_data(data: &str) -> Result<Vec<CourseStatus>, AppError> {
    validate(data)?;

    let format = Format::detect(data);
    let lines: Vec<&str> = data.lines().collect();

    let raw_courses = match format {
        Format::Chrome => parse_chrome_lines(&lines)?,
        Format::Edge => parse_edge_lines(&lines)?,
    };

    let courses = assign_semester_numbers(raw_courses)?;

    if courses.is_empty() {
        return Err(AppError::Parser("Invalid copy paste data".into()));
    }

    Ok(courses)
}

#[cfg(test)]
#[path = "parser_v2_tests.rs"]
mod parser_v2_tests;
