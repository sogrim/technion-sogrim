use crate::{error::AppError, resources::catalog::Catalog};

use super::credit_transfer_graph::validate_acyclic_credit_transfer_graph;

pub fn validate_catalog(mut catalog: Catalog) -> Result<Catalog, AppError> {
    validate_acyclic_credit_transfer_graph(&catalog)?;
    Ok(catalog)
}
