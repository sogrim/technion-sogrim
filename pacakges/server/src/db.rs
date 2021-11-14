
use mongodb::Client;
use actix_web::error::{self, Error};
use crate::core::*;
use crate::user::User;
use crate::course::Course;
pub use bson::{Document, doc};


pub mod services{

    use super::*;
    use actix_web::error::ErrorInternalServerError;
    use bson::oid::ObjectId;
    use mongodb::results::InsertOneResult;

    #[macro_export]
    macro_rules! impl_get {
        (
            fn_name : $fn_name:ident, 
            db_item : $db_item:ty, 
            db_key_type : $db_key_type:ty, 
            db_key_name : $db_key_name:literal

        ) => {
            pub async fn $fn_name(item : $db_key_type, client: &Client) -> Result<$db_item, Error> {
                match client
                    .database(std::env::var("PROFILE").unwrap_or("debug".into()).as_str())
                    .collection::<$db_item>(format!("{}s", stringify!($db_item)).as_str())
                    .find_one(doc!{$db_key_name : item}, None)
                    .await
                    {
                        Ok(Some(item)) => Ok(item),
                        Ok(None) => Err(error::ErrorNotFound(item.to_string())),
                        Err(err) => {
                            eprintln!("{:#?}", err);
                            Err(error::ErrorInternalServerError(err.to_string()))
                        },
                    }
            }
        };
    }

    impl_get!(
        fn_name : get_catalog_by_id, 
        db_item : Catalog, 
        db_key_type: &ObjectId, 
        db_key_name: "_id"
    );

    impl_get!(
        fn_name : get_course_by_number, 
        db_item : Course, 
        db_key_type: u32, 
        db_key_name: "_id"
    );

    impl_get!(
        fn_name : get_user_by_id, 
        db_item : User, 
        db_key_type: &str, 
        db_key_name: "_id"
    );

    // pub async fn add_user(sub: String, client: &Client) -> Result<InsertOneResult, Error> {

    //     let new_user = User::new(sub);

    //     client
    //         .database(std::env::var("PROFILE").unwrap_or("debug".into()).as_str())
    //         .collection::<User>("Users")
    //         .insert_one(new_user, None)
    //         .await
    //         .map_err(|err| {
    //             eprintln!("{:#?}", err);
    //             ErrorInternalServerError(err)
    //         })
    // }
}