use std::collections::HashMap;

use crate::core::types::Rule;
use crate::resources::catalog::Catalog;
use crate::resources::catalog::Faculty;
use crate::resources::course::CourseBank;

use super::*;

fn bank(name: &str, credit: Option<f32>) -> CourseBank {
    CourseBank {
        name: name.to_string(),
        rule: Rule::All,
        credit,
    }
}

fn catalog(course_banks: Vec<CourseBank>, credit_overflows: Vec<CreditOverflow>) -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: "catalog".to_string(),
        faculty: Faculty::Unknown,
        total_credit: 0.0,
        description: String::new(),
        course_banks,
        credit_overflows,
        course_to_bank: HashMap::new(),
        catalog_replacements: HashMap::new(),
        common_replacements: HashMap::new(),
    }
}

#[test]
fn find_traversal_order_returns_empty_for_invalid_transfer_rules() {
    let catalog = catalog(
        vec![bank("A", Some(1.0))],
        vec![CreditOverflow {
            from: "A".to_string(),
            to: "MISSING".to_string(),
        }],
    );

    assert!(find_traversal_order(&catalog).is_empty());
}

#[test]
fn find_traversal_order_respects_credit_overflow_direction() {
    let catalog = catalog(
        vec![
            bank("A", Some(1.0)),
            bank("B", Some(1.0)),
            bank("C", Some(1.0)),
        ],
        vec![
            CreditOverflow {
                from: "A".to_string(),
                to: "B".to_string(),
            },
            CreditOverflow {
                from: "B".to_string(),
                to: "C".to_string(),
            },
        ],
    );

    let ordered = find_traversal_order(&catalog);
    let index = |name: &str| {
        ordered
            .iter()
            .position(|bank| bank.name == name)
            .expect("bank should exist in traversal order")
    };

    assert!(index("A") < index("B"));
    assert!(index("B") < index("C"));
}

#[test]
fn validate_acyclic_credit_transfer_graph_rejects_cycle() {
    let catalog = catalog(
        vec![bank("A", Some(1.0)), bank("B", Some(1.0))],
        vec![
            CreditOverflow {
                from: "A".to_string(),
                to: "B".to_string(),
            },
            CreditOverflow {
                from: "B".to_string(),
                to: "A".to_string(),
            },
        ],
    );

    let result = validate_acyclic_credit_transfer_graph(&catalog);
    assert!(result.is_err());
}
