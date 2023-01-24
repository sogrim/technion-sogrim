use std::fmt::Write;

use crate::resources::course::Course;

const ZERO: f32 = 0.0;
const HALF: f32 = 0.5;
const SINGLE: f32 = 1.0;

pub fn common_replacements_msg(course: &Course) -> String {
    format!(
        "הנחנו כי קורס זה מחליף את הקורס {} ({}) בעקבות החלפות נפוצות. שימו לב כי נדרש אישור מהרכזות בשביל החלפה זו",
        course.name,
        course.id
    )
}

pub fn catalog_replacements_msg(course: &Course) -> String {
    format!("קורס זה מחליף את הקורס {} ({})", course.name, course.id)
}

pub fn credit_overflow_msg(overflow: f32, from: &str, to: &str) -> String {
    if overflow == SINGLE {
        format!("נקודה אחת עברה מ{} ל{}", from, to)
    } else if overflow == HALF {
        format!("חצי נקודה עברה מ{} ל{}", from, to)
    } else {
        format!("עברו {} נקודות מ{} ל{}", overflow, from, to)
    }
}

pub fn credit_overflow_detailed_msg(from: &str, to: &str) -> String {
    format!("הנקודות שבוצעו ב{} נספרות תחת {}", from, to)
}

pub fn courses_overflow_msg(overflow: f32, from: &str, to: &str) -> String {
    if overflow == SINGLE {
        format!(
            "ביצעת יותר קורסים ממה שנדרש ב{}, הקורס העודף נספר תחת הדרישה {}",
            from, to
        )
    } else {
        format!(
            "ביצעת יותר קורסים ממה שנדרש ב{}, {} הקורסים העודפים נספרים תחת הדרישה {}",
            from, overflow, to
        )
    }
}

pub fn missing_credit_msg(overflow: f32, from: &str, to: &str) -> String {
    if overflow == SINGLE {
        format!(
            "סך הנקודות של הקורסים שלקחת ב{} נמוך מהדרישה המקורית, לכן נקודה אחת התווספה לדרישה של {}",
            from, to
        )
    } else {
        format!(
            "סך הנקודות של הקורסים שלקחת ב{} נמוך מהדרישה המקורית, לכן {} נקודות התווספו לדרישה של {}",
            from, overflow, to
        )
    }
}

pub fn completed_chain_msg(mut chain: Vec<String>) -> String {
    let mut msg = "השלמת את השרשרת: ".to_string();
    while let Some(course) = chain.pop() {
        if chain.is_empty() {
            msg += &course;
        } else {
            let _ = write!(msg, "{}, ", course);
        }
    }
    msg
}

pub fn completed_specialization_groups_msg(mut groups: Vec<String>, needed: usize) -> String {
    let mut msg = if groups.len() == ZERO as usize {
        "לא השלמת אף קבוצת התמחות".to_string()
    } else if groups.len() == SINGLE as usize {
        format!("השלמת קבוצת התמחות אחת (מתוך {}): ", needed)
    } else {
        format!("השלמת {} (מתוך {}) קבוצות התמחות: ", groups.len(), needed)
    };
    while let Some(group) = groups.pop() {
        if groups.is_empty() {
            msg += &group;
        } else {
            let _ = write!(msg, "{}, ", group);
        }
    }
    msg
}

pub fn credit_leftovers_msg(credit: f32) -> String {
    if credit == ZERO {
        "אין לך נקודות עודפות".to_string()
    } else if credit == SINGLE {
        "יש לך נקודה עודפת אחת".to_string()
    } else if credit == HALF {
        "יש לך חצי נקודה עודפת".to_string()
    } else {
        format!("יש לך {} נקודות עודפות", credit)
    }
}

pub fn cannot_find_course() -> String {
    "שגיאה - קורס לא נמצא".to_string()
}

pub fn english_requirement_for_exempt_students_msg() -> String {
    "לא השלמת את דרישת האנגלית לסיום התואר. סטודנטים שהתחילו את לימודיהם החל מ-תשפ\"ב נדרשים לקחת שני קורסי תוכן באנגלית.".to_string()
}

pub fn english_requirement_for_technical_advanced_b_students_msg() -> String {
    "לא השלמת את דרישת האנגלית לסיום התואר. סטודנטים שהתחילו את לימודיהם החל מ-תשפ\"ב נדרשים לקחת קורס תוכן באנגלית בנוסף לקורס אנגלית טכנית מתקדמים ב ".to_string()
}

/////////////////////////////////////////////////////////////////////////////////
/// Error messages
/////////////////////////////////////////////////////////////////////////////////

pub fn cyclic_credit_transfer_graph(bank_in_cycle: &str) -> String {
    format!(
        "קיימת תלות מעגלית במעברי הנקודות שנקבעו. התלות המעגלית מתחילה ונגמרת ב{}",
        bank_in_cycle
    )
}

pub fn build_credit_transfer_graph_failed() -> String {
    "בניית הגרף נכשלה".to_string()
}
