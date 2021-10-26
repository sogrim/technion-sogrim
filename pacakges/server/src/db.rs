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

    pub async fn get_catalog(catalog_oid : bson::oid::ObjectId, conn: &Connection<Db>) -> Result<Catalog, Status>{
        match conn
            .database(std::env::var("ROCKET_PROFILE").unwrap().as_str())
            .collection::<Catalog>("Catalogs")
            .find_one(doc!{"_id:" : catalog_oid}, None)
            .await
            {
                Ok(maybe_catalog) => maybe_catalog.ok_or(Status::InternalServerError),
                Err(err) => {
                    eprintln!("{}", err);
                    Err(Status::ServiceUnavailable)
                },
            }
    }

    pub async fn get_course(course_number : u32, conn: &Connection<Db>) -> Result<Course, Status>{
        match conn
            .database(std::env::var("ROCKET_PROFILE").unwrap().as_str())
            .collection::<Course>("Courses")
            .find_one(doc!{"_id:" : course_number}, None)
            .await
            {
                Ok(maybe_course) => maybe_course.ok_or(Status::InternalServerError),
                Err(err) => {
                    eprintln!("{}", err);
                    Err(Status::ServiceUnavailable)
                },
            }
    }
}


// TODO : consider this as "insert" via POST template.
//
// #[derive(Clone, Debug, Deserialize, Serialize)]
// struct Item<'r>{
//     _id : u32,
//     name : &'r str,
// }

// #[post("/<item_name>")]
// async fn add(item_name: &str, conn: Connection<Db>, db_name: &State<String>) -> Result<Json<String>, Status>{
//     conn.database(db_name)
//         .collection::<Item>("hello_world")
//         .insert_one(Item { _id : 3141523, name: item_name}, None)
//         .await
//         .map(|res| {Json(res.inserted_id.to_string())})
//         .map_err(|_| {Status::InternalServerError})
// }
// enum CourseType{
//     Mandatory,
//     Choice,
//     FreeChoice,
//     Malag,
//     ReshimaA,
//     ReshimaB
// }
// struct Course{
//     id            : u32,
//     name          : String,
//     credit_points : u8,
//     r#type        : CourseType 
// }
// struct Manager{
//     courses : HashMap<u32, Course>,
// }
// impl Manager{
//     pub fn new() -> Self{
//         Manager { courses: HashMap::new() }
//     }
// }