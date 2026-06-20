use regex::Regex;
use std::sync::LazyLock;

use crate::{
    error::AppError,
    resources::course::{AcademicSemester, Course, CourseId, CourseStatus, Grade, SemesterSeason},
};
use std::collections::HashMap;

static CREDIT_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?P<credit>(([1-9][0-9]|[0-9])\.[0-9]))").unwrap());
static COURSE_ID_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?P<course_id>[0-9]{6})").unwrap());
static GRADE_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
    r"(?P<grade>(100|([1-9][0-9])|[0-9]$)|פטור ללא ניקוד|פטור עם ניקוד|עבר|נכשל|לא השלים|לא השלים(מ)|-$|^--| -  )"
).unwrap()
});

enum Format {
    Default,
    MedicineFirefox,
    MedicineAcrobatReader,
}

impl Format {
    fn validate(&self, data: &str) -> bool {
        match self {
            Format::Default => {
                data.starts_with("גיליון ציונים") && data.contains("סוף גיליון ציונים")
            }
            Format::MedicineFirefox => {
                data.contains("ציונים גליון") && data.contains("ציונים גליון סוף")
            }
            Format::MedicineAcrobatReader => {
                data.contains("גליון ציונים") && data.contains("סוף גליון ציונים")
            }
        }
    }
    fn is_one_of_valid_formats(data: &str) -> bool {
        Self::Default.validate(data)
            || Self::MedicineFirefox.validate(data)
            || Self::MedicineAcrobatReader.validate(data)
    }
}

pub fn parse_copy_paste_data(data: &str) -> Result<Vec<CourseStatus>, AppError> {
    // Sanity validation
    if !(Format::is_one_of_valid_formats(data)) {
        return Err(AppError::Parser("Invalid copy paste data".into()));
    }

    let mut courses = HashMap::<CourseId, CourseStatus>::new();
    let mut asterisk_courses = Vec::<CourseStatus>::new();
    let mut sport_courses = Vec::<CourseStatus>::new();
    let mut current_legacy_name: Option<String> = None;
    let mut current_season: Option<SemesterSeason> = None;
    let mut semester_counter: f32 = 0.0;
    let should_reverse_credit = CREDIT_RE
        .captures_iter(
            data.split_terminator('\n')
                .filter(|line| COURSE_ID_RE.is_match(line) && !line.contains("ת.ז"))
                .collect::<Vec<_>>()
                .join("\n")
                .as_str(),
        )
        // A potential bug here if the student only has courses with credit in one of [0.0, 0.5, 5.0, 5.5]
        // TODO: Fix this
        .any(|credit| !credit["credit"].ends_with('0') && !credit["credit"].ends_with('5'));
    let should_reverse_name = data.contains("ציונים גליון סוף");

    for line_ref in data.split_terminator('\n') {
        let line = line_ref.to_string();

        let is_spring = line.contains("אביב");
        let is_winter = line.contains("חורף");
        let is_summer = line.contains("קיץ");

        if is_spring || is_summer || is_winter {
            semester_counter += if is_summer || semester_counter.fract() != 0.0 {
                0.5
            } else {
                1.0
            };

            let (season, season_he) = if is_spring {
                (SemesterSeason::Spring, "אביב")
            } else if is_summer {
                (SemesterSeason::Summer, "קיץ")
            } else {
                (SemesterSeason::Winter, "חורף")
            };

            current_legacy_name = Some(format!("{season_he}_{semester_counter}"));
            current_season = Some(season);
        }

        if !COURSE_ID_RE.is_match(&line) || line.contains("ת.ז") {
            continue;
        }

        let (course, grade) =
            parse_course_status_pdf_format(&line, should_reverse_credit, should_reverse_name)?;

        // Stash the legacy ordinal name on the semester; it's swapped for a
        // calendar-anchored `AcademicSemester` once we've seen the full list of
        // semesters in this grade sheet.
        let semester = match (current_season, current_legacy_name.as_ref()) {
            (Some(season), Some(name)) => {
                Some(AcademicSemester::with_legacy_marker(season, name.clone()))
            }
            _ => None,
        };

        let mut course_status = CourseStatus {
            course,
            semester,
            grade,
            ..Default::default()
        };
        course_status.set_state();
        if course_status.course.id.starts_with("0394") {
            sport_courses.push(course_status);
            continue;
        }
        if line.contains('*') {
            // If a student decides to retake a course for which he already had a grade,
            // and then ends up not receiving a grade (לא השלים) for that course,
            // The previous grade for this course is the valid one.
            // Nevertheless, the previous grade will appear with an asterisk (*) in the grades pdf.
            // Thus, to make sure we don't ignore these cases, we have to save a list of every asterisk-marked course,
            // and then search this list for courses who fall in this particular case, and fix their grade.
            asterisk_courses.push(course_status);
        } else {
            *courses
                .entry(course_status.course.id.clone())
                .or_insert(course_status) = course_status.clone();
        }
    }
    let mut vec_courses = courses.into_values().collect::<Vec<_>>();

    // Resolve every parsed legacy ordinal name to a real (season, start_year) in
    // one pass — anchoring the newest ordinal to the current academic semester.
    resolve_legacy_semesters(&mut vec_courses, &mut asterisk_courses, &mut sport_courses);

    // Fix the grades for said courses
    set_grades_for_uncompleted_courses(&mut vec_courses, &asterisk_courses);

    vec_courses.append(&mut sport_courses);

    if vec_courses.is_empty() {
        return Err(AppError::Parser("Invalid copy paste data".into()));
    }

    for course_status in vec_courses.iter_mut() {
        // Use asterisk courses to look for repetitions of the current course
        let mut course_repetitions = asterisk_courses
            .iter()
            .filter(|cs| course_status.course.id == cs.course.id)
            .collect::<Vec<_>>();

        // Deduplicate the list of repetitions by semester
        course_repetitions.dedup_by_key(|cs| cs.semester.clone());

        // Remove the current course status from the list of repetitions
        course_repetitions.retain(|cs| cs.semester != course_status.semester);

        // Set the number of repetitions
        course_status.times_repeated = course_repetitions.len();
    }

    Ok(vec_courses)
}

fn resolve_legacy_semesters(
    vec_courses: &mut [CourseStatus],
    asterisk_courses: &mut [CourseStatus],
    sport_courses: &mut [CourseStatus],
) {
    let legacy_names: Vec<String> = vec_courses
        .iter()
        .chain(asterisk_courses.iter())
        .chain(sport_courses.iter())
        .filter_map(|cs| cs.semester.as_ref().and_then(|s| s.legacy_name()))
        .map(String::from)
        .collect();

    if legacy_names.is_empty() {
        return;
    }

    let resolution = AcademicSemester::resolve_legacy_names(&legacy_names);

    let apply = |cs: &mut CourseStatus| {
        if let Some(sem) = cs.semester.as_ref() {
            if let Some(name) = sem.legacy_name() {
                if let Some(resolved) = resolution.get(name) {
                    cs.semester = Some(resolved.clone());
                }
            }
        }
    };

    vec_courses.iter_mut().for_each(apply);
    asterisk_courses.iter_mut().for_each(apply);
    sport_courses.iter_mut().for_each(apply);
}

fn set_grades_for_uncompleted_courses(
    courses: &mut [CourseStatus],
    asterisk_courses: &[CourseStatus],
) {
    // The candidate course statuses are those with uncompleted (לא השלים) grades.
    // For each uncompleted course status, we iterate the asterisk list in reverse to find
    // the closest (most chronologically advanced) course status with a grade (anything other than NotComplete (לא השלים)).
    // If we find a course with such grade, then this course status will replace the old one.
    let uncompleted_courses = courses
        .iter_mut()
        .filter(|c| c.grade == Some(Grade::NotComplete))
        .collect::<Vec<_>>();
    for uncompleted_course in uncompleted_courses {
        for asterisk_course in asterisk_courses.iter().rev() {
            if let Some(grade) = &asterisk_course.grade {
                if uncompleted_course.course.id == asterisk_course.course.id
                    && grade != &Grade::NotComplete
                {
                    *uncompleted_course = asterisk_course.clone();
                    break;
                }
            }
        }
    }
}

fn extract_str_by_regex(
    line: &str,
    regex: &Regex,
    regex_name: &str,
) -> Result<(String, String), AppError> {
    let extracted = regex
        .captures(line)
        .ok_or_else(|| AppError::Parser("Bad Format".into()))?[regex_name]
        .trim()
        .to_string();
    let line = regex.replace(line, "");
    Ok((extracted, line.trim().to_string()))
}

fn parse_course_status_pdf_format(
    line: &str,
    should_reverse_credit: bool,
    should_reverse_name: bool,
) -> Result<(Course, Option<Grade>), AppError> {
    let line = line.replace('*', "");
    let (id, line) = extract_str_by_regex(&line, &COURSE_ID_RE, "course_id")?;
    let (credit, line) = extract_str_by_regex(&line, &CREDIT_RE, "credit")?;
    let (grade, line) = extract_str_by_regex(&line, &GRADE_RE, "grade")?;
    let name = if should_reverse_name {
        line.split_ascii_whitespace()
            .rev()
            .collect::<Vec<_>>()
            .join(" ")
    } else {
        line.trim().to_string()
    };

    let credit: f32 = if should_reverse_credit {
        credit
            .chars()
            .rev()
            .collect::<String>()
            .parse()
            .map_err(|_| AppError::Parser("Bad Format".into()))?
    } else {
        credit
            .parse()
            .map_err(|_| AppError::Parser("Bad Format".into()))?
    };
    let grade = match grade.as_str() {
        "פטור ללא ניקוד" => Some(Grade::ExemptionWithoutCredit),
        "פטור עם ניקוד" => Some(Grade::ExemptionWithCredit),
        "עבר" => Some(Grade::Binary(true)),
        "נכשל" => Some(Grade::Binary(false)), //TODO כתוב נכשל או שכתוב לא עבר?
        "לא השלים" => Some(Grade::NotComplete),
        "לא השלים(מ)" => Some(Grade::NotComplete),
        _ => grade.parse::<u32>().ok().map(Grade::Numeric),
    };
    Ok((
        Course {
            id: CourseId::new(id),
            credit,
            name,
            tags: None,
        },
        grade,
    ))
}

#[cfg(test)]
#[path = "parser_tests.rs"]
mod parser_tests;
