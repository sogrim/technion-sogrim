use crate::{core::CreditOverflow, course::CourseBank, db, user::User};
use actix_web::{
    get,
    web::{self},
    Error, HttpResponse,
};
use mongodb::Client;
use serde::{self, Deserialize, Serialize};

pub(crate) type OptionalCourses = Vec<u32>;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Catalog {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub id: bson::oid::ObjectId,
    pub name: String,
    pub total_credit: f64,
    pub description: String,
    pub course_banks: Vec<CourseBank>,
    pub course_to_bank: Vec<(u32, String)>,
    pub credit_overflows: Vec<CreditOverflow>,
    pub catalog_replacements: Vec<(u32, OptionalCourses)>, // All replacements which are mentioned in the catalog
    pub common_replacements: Vec<(u32, OptionalCourses)>, // Common replacement which usually approved by the coordinators
}

impl Catalog {
    pub fn get_course_list(&self, name: &str) -> Vec<u32> {
        let mut course_list_for_bank = Vec::new();
        for (course_number, bank_name) in &self.course_to_bank {
            if *bank_name == name {
                course_list_for_bank.push(*course_number);
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
    _: User, //TODO think about whether this is necessary
) -> Result<HttpResponse, Error> {
    db::services::get_all_catalogs(&client)
        .await
        .map(|catalogs| HttpResponse::Ok().json(catalogs))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth;
    use crate::config::CONFIG;
    use actix_rt::test;
    use actix_web::{
        test::{self},
        web, App,
    };
    use dotenv::dotenv;
    use mongodb::Client;

    #[test]
    pub async fn test_get_all_catalogs() {
        dotenv().ok();
        let client = Client::with_uri_str(CONFIG.uri)
            .await
            .expect("failed to connect");

        let app = test::init_service(
            App::new()
                .wrap(auth::AuthenticateMiddleware)
                .app_data(web::Data::new(client.clone()))
                .service(super::get_all_catalogs),
        )
        .await;

        // Create and send request
        let resp = test::TestRequest::get()
            .uri("/catalogs")
            .insert_header(("authorization", "bugo-the-debugo"))
            .send_request(&app)
            .await;

        assert!(resp.status().is_success());

        // Check for valid json response
        let vec_catalogs: Vec<DisplayCatalog> = test::read_body_json(resp).await;
        assert_eq!(vec_catalogs[0].name, "מדמח תלת שנתי");
    }
}
