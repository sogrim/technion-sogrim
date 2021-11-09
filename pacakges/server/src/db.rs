use std::time::Duration;
use std::ops::Deref;
use mongodb::{Client, options::ClientOptions};
use crate::core::*;
pub use bson::{Document, doc};
pub use rocket_db_pools::{Config, Connection, Database, Error as PoolsError, Pool};
pub use rocket::{State, http::Status, figment::Figment, serde::json::Json};

pub struct ClientUnit(Client);

impl Deref for ClientUnit{
    type Target = Client;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[rocket::async_trait]
impl Pool for ClientUnit {
    type Error = PoolsError<mongodb::error::Error, std::convert::Infallible>;

    type Connection = Client;

    async fn init(figment: &Figment) -> Result<Self, Self::Error> {
        let config = figment.extract::<Config>()?;
        let mut opts = ClientOptions::parse(&config.url).await.map_err(PoolsError::Init)?;
        opts.min_pool_size = config.min_connections;
        opts.max_pool_size = Some(config.max_connections as u32);
        opts.max_idle_time = config.idle_timeout.map(Duration::from_secs);
        opts.connect_timeout = Some(Duration::from_secs(config.connect_timeout));
        Ok(ClientUnit(Client::with_options(opts).map_err(PoolsError::Init)?))
    }

    async fn get(&self) -> Result<Self::Connection, Self::Error> {
        Ok(self.0.clone())
    }
}

#[derive(Database)]
#[database("Sogrim")]
pub struct Db(ClientUnit);

pub mod services{

    use super::*;
    use bson::oid::ObjectId;

    #[macro_export]
    macro_rules! impl_get {
        (
            fn_name : $fn_name:ident, 
            db_item : $db_item:ty, 
            db_key_type : $db_key_type:ty, 
            db_key_name : $db_key_name:literal

        ) => {
            pub async fn $fn_name(item : $db_key_type, conn: &Connection<Db>) -> Result<$db_item, Status>{
                match conn
                    .database(std::env::var("ROCKET_PROFILE").unwrap_or("debug".into()).as_str())
                    .collection::<$db_item>(format!("{}s", stringify!($db_item)).as_str())
                    .find_one(doc!{$db_key_name : item}, None)
                    .await
                    {
                        Ok(maybe_item) => {  
                            maybe_item.ok_or_else(||{
                                eprintln!("{} <{:?}> does not exist!", stringify!($db_item), item);
                                Status::InternalServerError
                            })
                        },
                        Err(err) => {
                            eprintln!("{}", err);
                            Err(Status::InternalServerError)
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
        fn_name : get_user_by_email, 
        db_item : User, 
        db_key_type: &str, 
        db_key_name: "email"
    );
}