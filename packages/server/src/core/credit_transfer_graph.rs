use petgraph::algo::toposort;
use petgraph::Graph;

use crate::error::AppError;
use crate::resources::catalog::Catalog;
use crate::resources::course::CourseBank;

use super::messages;
use super::types::CreditOverflow;

fn build_credit_transfer_graph(
    course_banks: &[CourseBank],
    credit_overflow_rules: &[CreditOverflow],
) -> Graph<String, ()> {
    let mut g = Graph::<String, ()>::new();
    for course_bank in course_banks {
        g.add_node(course_bank.name.clone());
    }
    for credit_rule in credit_overflow_rules {
        g.add_edge(
            // unwrap cannot fail because the credit rules are taken from bank names
            g.node_indices()
                .find(|i| g[*i] == credit_rule.from)
                .unwrap(),
            g.node_indices().find(|i| g[*i] == credit_rule.to).unwrap(),
            (),
        );
    }
    g
}

pub fn find_traversal_order(catalog: &Catalog) -> Vec<CourseBank> {
    let g = build_credit_transfer_graph(&catalog.course_banks, &catalog.credit_overflows);
    let order = toposort(&g, None).unwrap(); // unwrap can't fail because if the catalog exists in the database it means it is valid, i.e no cycles.
    let mut ordered_course_banks = Vec::<CourseBank>::new();
    for node in order {
        // unwrap cannot fail because the graph was built from bank names
        ordered_course_banks.push(catalog.get_course_bank_by_name(&g[node]).unwrap().clone());
    }
    ordered_course_banks
}

pub fn validate_acyclic_credit_transfer_graph(catalog: &Catalog) -> Result<(), AppError> {
    let g = build_credit_transfer_graph(&catalog.course_banks, &catalog.credit_overflows);
    match toposort(&g, None) {
        Ok(_) => Ok(()),
        Err(e) => Err(AppError::BadRequest(
            messages::cyclic_credit_transfer_graph(&g[e.node_id()]),
        )),
    }
}
