pub fn common_replacements_msg(name: &str) -> String {
    format!(
        "הנחנו כי קורס זה מחליף את הקורס {} בעקבות החלפות נפוצות.\n נא לשים לב כי נדרש אישור מהרכזות בשביל החלפה זו",
        name
    )
}

pub fn catalog_replacements_msg(name: &str) -> String {
    format!("קורס זה מחליף את הקורס {}", name)
}

pub fn credit_overflow_msg(overflow: f32, from: &str, to: &str) -> String {
    format!("עברו {} נקודות מ{} ל{}", overflow, from, to)
}

pub fn courses_overflow_msg(overflow: f32, from: &str, to: &str) -> String {
    format!("עברו {} קורסים מ{} ל{}", overflow, from, to)
}

pub fn missing_credit_msg(overflow: f32, from: &str, to: &str) -> String {
    format!(
        "ב{} היו {} נקודות חסרות שנוספו לדרישה של {}",
        from, overflow, to
    )
}

pub fn catalog_missing_credit_msg(missing_credit: f32) -> String {
    format!(
        "בוצעו החלפות בין קורסים עם מספר קטן יותר של נקודות, לכן נוצרו {} נקודות חסרות שעברו הלאה.",
        missing_credit
    )
}

pub fn completed_chain_msg(chain: &[String]) -> String {
    let mut msg = "הסטודנט השלים את השרשרת הבאה:\n".to_string();
    for course in chain {
        msg += &format!("{}\n", course);
    }
    msg
}

pub fn completed_specialization_groups_msg(groups: &[String]) -> String {
    let mut msg = format!("הסטודנט השלים {} קבוצות התמחות", groups.len());
    for group in groups {
        msg += &format!("{}\n", group);
    }
    msg
}

pub fn credit_leftovers_msg(credit: f32) -> String {
    format!("יש לסטודנט {} נקודות עודפות", credit)
}
