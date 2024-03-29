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
) -> Result<Graph<String, ()>, AppError> {
    let mut g = Graph::<String, ()>::new();
    for course_bank in course_banks {
        g.add_node(course_bank.name.clone());
    }
    for credit_rule in credit_overflow_rules {
        match (
            g.node_indices().find(|i| g[*i] == credit_rule.from),
            g.node_indices().find(|i| g[*i] == credit_rule.to),
        ) {
            (Some(from), Some(to)) => g.add_edge(from, to, ()),
            _ => {
                return Err(AppError::BadRequest(
                    messages::build_credit_transfer_graph_failed(),
                ))
            }
        };
    }
    Ok(g)
}

pub fn find_traversal_order(catalog: &Catalog) -> Vec<CourseBank> {
    let g = match build_credit_transfer_graph(&catalog.course_banks, &catalog.credit_overflows) {
        Ok(graph) => graph,
        Err(_) => {
            log::error!("corrupted catalog in the database - return empty list");
            return vec![];
        }
    };
    let order = toposort(&g, None).unwrap_or_else(|_| {
        log::error!(
            "corrupted catalog in the database - course banks will be set in an arbitrary order"
        );
        g.node_indices().collect::<Vec<_>>()
    });
    let mut ordered_course_banks = Vec::<CourseBank>::new();
    for node in order {
        if let Some(bank) = catalog.get_course_bank_by_name(&g[node]) {
            ordered_course_banks.push(bank.clone());
        }
    }
    ordered_course_banks
}

pub fn validate_acyclic_credit_transfer_graph(catalog: &Catalog) -> Result<(), AppError> {
    let g = build_credit_transfer_graph(&catalog.course_banks, &catalog.credit_overflows)?;
    match toposort(&g, None) {
        Ok(_) => Ok(()),
        Err(e) => Err(AppError::BadRequest(
            messages::cyclic_credit_transfer_graph(&g[e.node_id()]),
        )),
    }
}
