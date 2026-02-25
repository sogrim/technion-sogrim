use std::collections::HashMap;

use crate::{
    core::degree_status::DegreeStatus,
    core::types::{CreditOverflow, Rule},
    resources::{
        catalog::{Catalog, Faculty},
        course::CourseBank,
    },
};

use super::*;

fn make_catalog() -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: "catalog".to_string(),
        faculty: Faculty::Unknown,
        total_credit: 0.0,
        description: String::new(),
        course_banks: vec![
            CourseBank {
                name: "from".to_string(),
                rule: Rule::All,
                credit: Some(4.0),
            },
            CourseBank {
                name: "to".to_string(),
                rule: Rule::All,
                credit: Some(4.0),
            },
        ],
        credit_overflows: vec![CreditOverflow {
            from: "from".to_string(),
            to: "to".to_string(),
        }],
        course_to_bank: HashMap::new(),
        catalog_replacements: HashMap::new(),
        common_replacements: HashMap::new(),
    }
}

#[test]
fn handle_credit_overflow_updates_total_credit_and_map() {
    let mut degree_status = DegreeStatus::default();
    let catalog = make_catalog();
    let mut handler = DegreeStatusHandler {
        degree_status: &mut degree_status,
        course_banks: vec![],
        catalog: &catalog,
        courses: HashMap::new(),
        credit_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    };

    let from = catalog.get_course_bank_by_name("from").unwrap();
    let accepted_credit = handler.handle_credit_overflow(from, 4.0, 6.0);

    assert_eq!(accepted_credit, 4.0);
    assert_eq!(handler.degree_status.total_credit, 4.0);
    assert_eq!(handler.credit_overflow_map.get("from"), Some(&2.0));
}

#[test]
fn handle_courses_overflow_stores_extra_courses() {
    let mut degree_status = DegreeStatus::default();
    let catalog = make_catalog();
    let mut handler = DegreeStatusHandler {
        degree_status: &mut degree_status,
        course_banks: vec![],
        catalog: &catalog,
        courses: HashMap::new(),
        credit_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    };

    let from = catalog.get_course_bank_by_name("from").unwrap();
    let accepted_courses = handler.handle_courses_overflow(from, 2, 5);

    assert_eq!(accepted_courses, 2);
    assert_eq!(handler.courses_overflow_map.get("from"), Some(&3.0));
}

#[test]
fn calculate_overflows_moves_credit_and_clears_source_overflow() {
    let mut degree_status = DegreeStatus::default();
    let catalog = make_catalog();
    let mut handler = DegreeStatusHandler {
        degree_status: &mut degree_status,
        course_banks: vec![],
        catalog: &catalog,
        courses: HashMap::new(),
        credit_overflow_map: HashMap::from([("from".to_string(), 1.5)]),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    };

    let moved = handler.calculate_overflows("to", Transfer::CreditOverflow);

    assert_eq!(moved, 1.5);
    assert_eq!(handler.credit_overflow_map.get("from"), Some(&0.0));
    assert_eq!(
        handler.degree_status.overflow_msgs,
        vec![credit_overflow_msg(1.5, "from", "to")]
    );
}

#[test]
fn calculate_overflows_uses_missing_credit_message_variant() {
    let mut degree_status = DegreeStatus::default();
    let catalog = make_catalog();
    let mut handler = DegreeStatusHandler {
        degree_status: &mut degree_status,
        course_banks: vec![],
        catalog: &catalog,
        courses: HashMap::new(),
        credit_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::from([("from".to_string(), 2.0)]),
        courses_overflow_map: HashMap::new(),
    };

    let moved = handler.calculate_overflows("to", Transfer::MissingCredit);

    assert_eq!(moved, 2.0);
    assert_eq!(handler.missing_credit_map.get("from"), Some(&0.0));
    assert_eq!(
        handler.degree_status.overflow_msgs,
        vec![missing_credit_msg(2.0, "from", "to")]
    );
}
