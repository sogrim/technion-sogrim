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

fn bank(name: &str, credit: Option<f32>) -> CourseBank {
    CourseBank {
        name: name.to_string(),
        rule: Rule::Wildcard(false),
        credit,
    }
}

fn catalog() -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: "catalog".to_string(),
        faculty: Faculty::Unknown,
        total_credit: 0.0,
        description: String::new(),
        course_banks: vec![bank("from", None), bank("to", Some(5.0))],
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
fn compute_status_adds_detailed_overflow_message_for_creditless_bank() {
    let mut degree_status = DegreeStatus::default();
    let catalog = catalog();
    let handler = DegreeStatusHandler {
        degree_status: &mut degree_status,
        course_banks: catalog.course_banks.clone(),
        catalog: &catalog,
        courses: HashMap::new(),
        credit_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    };

    handler.compute_status();

    assert!(degree_status
        .overflow_msgs
        .contains(&messages::credit_overflow_detailed_msg("from", "to")));
}

#[test]
fn compute_status_adds_credit_leftovers_to_total_credit() {
    let mut degree_status = DegreeStatus::default();
    let catalog = catalog();
    let handler = DegreeStatusHandler {
        degree_status: &mut degree_status,
        course_banks: vec![],
        catalog: &catalog,
        courses: HashMap::new(),
        credit_overflow_map: HashMap::from([("left".to_string(), 3.5)]),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    };

    handler.compute_status();

    assert_eq!(degree_status.total_credit, 3.5);
    assert_eq!(
        degree_status.overflow_msgs,
        vec![messages::credit_leftovers_msg(3.5)]
    );
}
