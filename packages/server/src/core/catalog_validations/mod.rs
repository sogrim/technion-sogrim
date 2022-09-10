pub mod specialization_groups_validations;

use crate::{error::AppError, resources::catalog::Catalog};

use self::specialization_groups_validations::fix_specialization_groups;

use super::credit_transfer_graph::validate_acyclic_credit_transfer_graph;

pub fn validate_catalog(mut catalog: Catalog) -> Result<Catalog, AppError> {
    validate_acyclic_credit_transfer_graph(&catalog)?;
    fix_specialization_groups(&mut catalog);
    Ok(catalog)
}
