use crate::{error::AppError, resources::catalog::Catalog};

use super::credit_transfer_graph::validate_acyclic_credit_transfer_graph;

pub fn validate_catalog(catalog: &Catalog) -> Result<(), AppError> {
    validate_acyclic_credit_transfer_graph(&catalog)?;
    Ok(())
}

#[allow(clippy::float_cmp)]
#[cfg(test)]
pub mod tests;
