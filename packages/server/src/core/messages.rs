const ZERO: f32 = 0.0;
const HALF: f32 = 0.5;
const SINGLE: f32 = 1.0;

pub fn common_replacements_msg(name: &str) -> String {
    format!(
        "הנחנו כי קורס זה מחליף את הקורס {} בעקבות החלפות נפוצות. שימו לב כי נדרש אישור מהרכזות בשביל החלפה זו",
        name
    )
}

pub fn catalog_replacements_msg(name: &str) -> String {
    format!("קורס זה מחליף את הקורס {}", name)
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

pub fn completed_chain_msg(chain: &[String]) -> String {
    let mut msg = "השלמת את השרשרת: ".to_string();
    for course in chain {
        if course == chain.last().unwrap() {
            msg += course;
        } else {
            msg += &format!("{}, ", course);
        }
    }
    msg
}

pub fn completed_specialization_groups_msg(groups: &[String], needed: usize) -> String {
    let mut msg = if groups.len() == ZERO as usize {
        "לא השלמת אף קבוצת התמחות".to_string()
    } else if groups.len() == SINGLE as usize {
        format!("השלמת קבוצת התמחות אחת (מתוך {}): ", needed)
    } else {
        format!("השלמת {} (מתוך {}) קבוצות התמחות: ", groups.len(), needed)
    };
    for group in groups {
        if group == groups.last().unwrap() {
            msg += group;
        } else {
            msg += &format!("{}, ", group);
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
