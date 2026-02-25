use std::collections::HashMap;

use crate::{
    core::degree_status::DegreeStatus,
    resources::catalog::{Catalog, Faculty},
};

use super::*;

fn catalog() -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: "catalog".to_string(),
        faculty: Faculty::Unknown,
        total_credit: 0.0,
        description: String::new(),
        course_banks: vec![],
        credit_overflows: vec![],
        course_to_bank: HashMap::new(),
        catalog_replacements: HashMap::new(),
        common_replacements: HashMap::new(),
    }
}

#[test]
fn compute_bank_wildcard_creates_uncompleted_requirement() {
    let mut degree_status = DegreeStatus::default();
    let catalog = catalog();
    let mut handler = DegreeStatusHandler {
        degree_status: &mut degree_status,
        course_banks: vec![],
        catalog: &catalog,
        courses: HashMap::new(),
        credit_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    };

    let bank = CourseBank {
        name: "wild".to_string(),
        rule: Rule::Wildcard(false),
        credit: Some(2.0),
    };

    handler.compute_bank(bank, vec![], 0.0, 0.0, 0);

    assert_eq!(handler.degree_status.course_bank_requirements.len(), 1);
    let requirement = &handler.degree_status.course_bank_requirements[0];
    assert_eq!(requirement.course_bank_name, "wild");
    assert_eq!(requirement.bank_rule_name, "wildcard");
    assert_eq!(requirement.credit_requirement, Some(2.0));
    assert_eq!(requirement.credit_completed, 0.0);
    assert!(!requirement.completed);
}
