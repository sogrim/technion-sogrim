use std::collections::HashMap;
use crate::{
    core::CreditOverflow,
    course::{Course, CourseBank, CourseTableRow},
    db,
    user::User,
};
use actix_web::{
    get,
    web::{self},
    Error, HttpResponse,
};
use mongodb::Client;
use serde::{self, Deserialize, Serialize};

pub(crate) type Replacements = Vec<Course>;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Catalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: bson::oid::ObjectId,
    pub name: String,
    pub total_credit: f64,
    pub description: String,
    pub course_banks: Vec<CourseBank>,
    pub course_table: Vec<CourseTableRow>,
    pub credit_overflows: Vec<CreditOverflow>,
    pub catalog_replacements: HashMap<u32, Replacements>, // All replacements which are mentioned in the catalog
}

impl Catalog {
    pub fn get_course_list(&self, name: &str) -> Vec<u32> {
        let mut course_list_for_bank = Vec::new();
        for course_row in &self.course_table {
            if course_row.course_banks.contains(&name.to_string()) {
                course_list_for_bank.push(course_row.number);
            }
        }
        course_list_for_bank
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DisplayCatalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: bson::oid::ObjectId,
    pub name: String,
    pub total_credit: f64,
    pub description: String,
}

impl From<Catalog> for DisplayCatalog {
    fn from(catalog: Catalog) -> Self {
        DisplayCatalog {
            id: catalog.id,
            name: catalog.name,
            total_credit: catalog.total_credit,
            description: catalog.description,
        }
    }
}

#[get("/catalogs")]
pub async fn get_all_catalogs(
    client: web::Data<Client>,
    _: User, //TODO think about whether this is neccesary
) -> Result<HttpResponse, Error> {
    db::services::get_all_catalogs(&client).await
}
