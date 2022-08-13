pub mod points_transition_graph_validations;

use crate::resources::catalog::Catalog;

use self::points_transition_graph_validations::validate_acyclic_credit_transfer_graph;

pub fn validate_catalog(catalog: Catalog) -> Catalog {
    validate_acyclic_credit_transfer_graph(&catalog);
    catalog
}
