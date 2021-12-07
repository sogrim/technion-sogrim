use crate::auth::Sub;
use crate::catalog::DisplayCatalog;
use crate::core::{self, *};
use crate::course::{self, CourseStatus};
use crate::db;
use actix_web::dev::Payload;
use actix_web::error::{ErrorInternalServerError, ErrorUnauthorized};
use actix_web::{get, post, put, web, Error, FromRequest, HttpRequest, HttpResponse};
use bson::doc;
use futures_util::Future;
use mongodb::Client;
use serde::{Deserialize, Serialize};
use std::pin::Pin;
use std::str::FromStr;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    pub catalog: Option<DisplayCatalog>,
    pub degree_status: DegreeStatus,
    pub modified: bool,
}

impl UserDetails {
    pub fn get_mut_course_status(&mut self, number: u32) -> Option<&mut CourseStatus> {
        for course_status in &mut self.degree_status.course_statuses {
            if course_status.course.number == number {
                return Some(course_status);
            }
        }
        None
    }

    pub fn passed_course(&mut self, number: u32) -> bool {
        if let Some(course) = self.get_mut_course_status(number) {
            return course.passed();
        }
        false
    }
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub sub: String,
    pub details: Option<UserDetails>,
}

impl User {
    pub fn new_document(sub: &str) -> bson::Document {
        let user = User {
            sub: sub.into(),
            details: Some(UserDetails::default()),
        };
        // Should always unwrap successfully here..
        bson::to_document(&user).unwrap_or(doc! {"sub" : sub, "details": null})
    }
    pub fn into_document(self) -> bson::Document {
        // Should always unwrap successfully here..
        bson::to_document(&self).unwrap_or(doc! {"sub" : self.sub, "details": null})
    }
}

impl FromRequest for User {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let req = req.clone();
        Box::pin(async move {
            let client = match req.app_data::<web::Data<Client>>() {
                Some(client) => client,
                None => return Err(ErrorInternalServerError("Db client was not initialized!")),
            };
            match req.extensions().get::<Sub>() {
                Some(user_id) => db::services::get_user_by_id(user_id, client)
                    .await
                    .map_err(ErrorInternalServerError),
                None => Err(ErrorUnauthorized(
                    "Authorization process did not complete successfully!",
                )),
            }
        })
    }

    fn extract(req: &HttpRequest) -> Self::Future {
        Self::from_request(req, &mut Payload::None)
    }
}

#[get("/user/login")]
pub async fn login(client: web::Data<Client>, req: HttpRequest) -> Result<HttpResponse, Error> {
    let extensions = req.extensions();
    let user_id = extensions
        .get::<Sub>()
        .ok_or_else(|| ErrorInternalServerError("Middleware Internal Error"))?;

    let document = doc! {"$setOnInsert" : User::new_document(user_id)};
    db::services::find_and_update_user(user_id, document, &client).await
}

#[put("/user/catalog")]
pub async fn add_catalog(
    client: web::Data<Client>,
    catalog_id: String,
    mut user: User,
) -> Result<HttpResponse, Error> {
    match &mut user.details {
        Some(details) => {
            let obj_id =
                bson::oid::ObjectId::from_str(&catalog_id).map_err(ErrorInternalServerError)?;
            let catalog = db::services::get_catalog_by_id(&obj_id, &client).await?;
            details.catalog = Some(DisplayCatalog::from(catalog));
            details.degree_status = DegreeStatus::default();
            details.modified = true;
            db::services::find_and_update_user(
                &user.sub.clone(),
                doc! {"$set" : user.into_document()},
                &client,
            )
            .await
        }
        None => Err(ErrorInternalServerError("No data exists for user")),
    }
}

#[post("/user/courses")]
pub async fn add_courses(
    client: web::Data<Client>,
    data: String,
    mut user: User,
) -> Result<HttpResponse, Error> {
    match &mut user.details {
        Some(details) => {
            details.degree_status = DegreeStatus::default();
            details.degree_status.course_statuses = course::parse_copy_paste_data(&data)?;
            details.modified = true;
            db::services::find_and_update_user(
                &user.sub.clone(),
                doc! {"$set" : user.into_document()},
                &client,
            )
            .await
        }
        None => Err(ErrorInternalServerError("No data exists for user")),
    }
}

// here "modified" becomes false
#[get("/user/compute")]
pub async fn compute_degree_status(
    client: web::Data<Client>,
    mut user: User,
) -> Result<HttpResponse, Error> {
    let mut user_details = user
        .details
        .as_mut()
        .ok_or_else(|| ErrorInternalServerError("No data exists for user"))?;

    let catalog_id = user_details
        .catalog
        .as_ref()
        .ok_or_else(|| ErrorInternalServerError("No data exists for user"))?
        .id;

    let catalog = db::services::get_catalog_by_id(&catalog_id, &client).await?;

    user_details.degree_status.course_bank_requirements.clear();
    user_details.degree_status.overflow_msgs.clear();
    user_details.degree_status.total_credit = 0.0;
    user_details.modified = false;

    core::calculate_degree_status(&catalog, user_details);

    for course_status in user_details.degree_status.course_statuses.iter_mut() {
        // Fill in courses without information
        let course = &mut course_status.course;
        if course.name.is_empty() {
            *course = db::services::get_course_by_number(course.number, &client).await?;
        }
    }
    let user_id = user.sub.clone();
    let document = doc! {"$set" : user.clone().into_document()};
    db::services::find_and_update_user(&user_id, document, &client).await?;
    Ok(HttpResponse::Ok().json(user))
}

// here "modified" becomes true
#[put("/user/details")]
pub async fn update_details(
    client: web::Data<Client>,
    details: web::Json<UserDetails>,
    mut user: User,
) -> Result<HttpResponse, Error> {
    let user_id = user.sub.clone();
    user.details = Some(details.into_inner());
    let document = doc! {"$set" : user.into_document()};
    db::services::find_and_update_user(&user_id, document, &client).await?;
    Ok(HttpResponse::Ok().finish())
}

// DEBUG..

#[derive(Clone, Debug, Deserialize, Serialize)]
struct DebugResponse {
    s: String,
}
impl From<String> for DebugResponse {
    fn from(s: String) -> Self {
        DebugResponse { s }
    }
}

#[get("/user/debug")]
pub async fn debug(content: String) -> HttpResponse {
    HttpResponse::Ok().json(DebugResponse::from(content))
}

#[cfg(test)]
mod tests {

    use crate::config::CONFIG;
    use crate::{auth, user::User};
    use actix_rt::test;
    use actix_web::{
        test::{self},
        web, App,
    };
    use dotenv::dotenv;
    use mongodb::Client;

    #[allow(clippy::float_cmp)]
    #[test]
    async fn test_user_login() {
        dotenv().ok();
        let client = Client::with_uri_str(CONFIG.uri)
            .await
            .expect("failed to connect");

        let app = test::init_service(
            App::new()
                .wrap(auth::AuthenticateMiddleware)
                .app_data(web::Data::new(client.clone()))
                .service(super::login),
        )
        .await;

        // Create and send request
        let resp = test::TestRequest::get()
            .uri("/user/login")
            .insert_header(("authorization", "bugo-the-debugo"))
            .send_request(&app)
            .await;

        assert!(resp.status().is_success());

        // Check for valid json response
        let user: User = test::read_body_json(resp).await;
        assert_eq!(user.sub, "bugo-the-debugo");
        assert!(user.details.is_some());
        assert_eq!(user.details.unwrap().degree_status.total_credit, 42.0);
    }
}
