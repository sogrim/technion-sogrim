use crate::{
    error::AppError,
    resources::course::{Course, CourseStatus, Grade},
};

fn contains_course_number(str: &str) -> bool {
    for word in str.split_whitespace() {
        let course_number = word.parse::<u32>();
        match course_number {
            Ok(number) if 10000 < number && number < 999999 => return true,
            Ok(_) => continue,
            Err(_) => continue,
        }
    }
    false
}

pub fn parse_copy_paste_data(data: &str) -> Result<Vec<CourseStatus>, AppError> {
    // Sanity validation
    if !(data.starts_with("גיליון ציונים") && data.contains("סוף גיליון ציונים"))
    {
        return Err(AppError::Parser("Invalid copy paste data".into()));
    }

    let mut courses = Vec::<CourseStatus>::new();
    let mut asterisk_courses = Vec::<CourseStatus>::new();
    let mut semester = String::new();
    let mut semester_counter: f32 = 0.0;

    for line_ref in data.split_terminator('\n') {
        let line = line_ref.to_string();

        let is_spring = line.contains("אביב");
        let is_winter = line.contains("חורף");
        let is_summer = line.contains("קיץ");

        semester = if is_spring || is_summer || is_winter {
            semester_counter += if is_summer || semester_counter.fract() != 0.0 {
                0.5
            } else {
                1.0
            };

            let semester_term = if is_spring {
                "אביב"
            } else if is_summer {
                "קיץ"
            } else {
                "חורף"
            };

            format!("{}_{}", semester_term, semester_counter)
        } else {
            semester
        };

        if !contains_course_number(&line) {
            continue;
        }

        let (course, grade) = parse_course_status_pdf_format(&line)?;

        let mut course_status = CourseStatus {
            course,
            semester: (!semester.is_empty()).then(|| semester.clone()),
            grade: grade.clone(),
            ..Default::default()
        };
        course_status.set_state();

        if line.contains('*') {
            // If a student decides to retake a course for which he already had a grade,
            // and then ends up not receiving a grade (לא השלים) for that course,
            // The previous grade for this course is the valid one.
            // Nevertheless, the previous grade will appear with an asterisk (*) in the grades pdf.
            // Thus, to make sure we don't ignore these cases, we have to save a list of every asterisk-marked course,
            // and then search this list for courses who fall in this particular case, and fix their grade.
            asterisk_courses.push(course_status);
        } else {
            courses.push(course_status);
        }
    }

    // HOTFIX - Some students had their course credit reversed.
    // This happend because the parser was not able to parse the course credit correctly,
    // probably because the student used a browser that was not supported.
    if courses
        .iter()
        .any(|cs| cs.course.credit.fract() != 0.0 && cs.course.credit.fract() != 0.5)
    {
        return Err(AppError::Parser(
            "Bad format, probably unsupported browser".into(),
        ));
    }

    // Fix the grades for said courses
    set_grades_for_uncompleted_courses(&mut courses, asterisk_courses);

    if courses.is_empty() {
        return Err(AppError::Parser("Invalid copy paste data".into()));
    }
    Ok(courses)
}

fn set_grades_for_uncompleted_courses(
    courses: &mut [CourseStatus],
    asterisk_courses: Vec<CourseStatus>,
) {
    // The candidate course statuses are those with uncompleted (לא השלים) grades.
    // For each uncompleted course status, we iterate the asterisk list in reverse to find
    // the closest (most chronologically advanced) course status with a grade (anything other than NotComplete (לא השלים)).
    // This course status will replace the old one.
    courses
        .iter_mut()
        .filter(|c| c.grade == Some(Grade::NotComplete))
        .for_each(|uncompleted_course| {
            if let Some(asterisk_course) = asterisk_courses.iter().rev().find(|cs| {
                uncompleted_course.course.id == cs.course.id
                    && cs.grade.is_some()
                    && cs.grade != Some(Grade::NotComplete)
            }) {
                *uncompleted_course = asterisk_course.clone();
            }
        });
}

fn parse_course_status_pdf_format(line: &str) -> Result<(Course, Option<Grade>), AppError> {
    let clean_line = line.replace('*', "");
    let id = {
        let number = clean_line
            .split(' ')
            .next()
            .ok_or_else(|| AppError::Parser("Bad Format".into()))?;
        if number.parse::<f32>().is_ok() {
            Ok(String::from(number))
        } else {
            Err(AppError::Parser("Bad Format".into()))
        }?
    };

    let mut index = 0;
    let mut credit = 0.0;
    let mut word;
    for part in clean_line.split(' ') {
        word = part.to_string();
        // When a grade is missing, a hyphen (מקף) char is written instead, without any whitespaces between it and the credit.
        // This means that the credit part is no longer parsable as f32, and therefore the hyphen must be manually removed.
        // This won't create a problem later in the code since 'word' only lives in the for-loop scope.
        if word.contains('-') && word.contains('.') {
            word = word.replace('-', "").trim().to_string();
        }
        if word.parse::<f32>().is_ok() && word.contains('.') {
            credit = word
                .chars()
                .rev()
                .collect::<String>()
                .parse::<f32>()
                .map_err(|e| AppError::Parser(format!("Bad Format: {}", e)))?;
            break;
        }
        index += 1;
    }

    let name = clean_line.split_whitespace().collect::<Vec<&str>>()[1..index].join(" ");

    let grade_str = clean_line
        .split_whitespace()
        .last()
        .ok_or_else(|| AppError::Parser("Bad Format".into()))?
        .trim();

    let grade = match grade_str as &str {
        "ניקוד" => {
            if clean_line.contains("ללא") {
                Some(Grade::ExemptionWithoutCredit)
            } else {
                Some(Grade::ExemptionWithCredit)
            }
        }
        "עבר" => Some(Grade::Binary(true)),
        "נכשל" => Some(Grade::Binary(false)), //TODO כתוב נכשל או שכתוב לא עבר?
        "השלים" if clean_line.contains("לא השלים") => Some(Grade::NotComplete),
        "השלים(מ)" if clean_line.contains("לא השלים") => Some(Grade::NotComplete),
        _ => grade_str.parse::<u8>().ok().map(Grade::Numeric),
    };
    Ok((Course { id, credit, name }, grade))
}
