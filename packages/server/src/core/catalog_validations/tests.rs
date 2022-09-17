use crate::core::{
    messages,
    tests::{get_catalog, COMPUTER_SCIENCE_3_YEARS_18_19_CATALOG_ID},
    types::CreditOverflow,
};
use actix_rt::test;

use super::validate_catalog;

#[test]
async fn test_catalog_validations() {
    let mut catalog = get_catalog(COMPUTER_SCIENCE_3_YEARS_18_19_CATALOG_ID).await;
    assert!(validate_catalog(&catalog).is_ok());

    // Add credit transfer between בחירה חופשית to רשימה א to close a cycle
    catalog.credit_overflows.push(CreditOverflow {
        from: "בחירה חופשית".to_string(),
        to: "רשימה א".to_string(),
    });

    let result = validate_catalog(&catalog);
    assert!(result.is_err());
    if let Err(e) = result {
        assert_eq!(
            e.to_string(),
            messages::cyclic_credit_transfer_graph("רשימה א")
        )
    }
}
