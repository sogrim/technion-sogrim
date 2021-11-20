use std::pin::Pin;
use std::str::FromStr;
use actix_web::dev::Payload;
use actix_web::error::{ErrorInternalServerError, ErrorUnauthorized};
use bson::doc;
use futures_util::Future;
use actix_web::{Error, FromRequest, HttpRequest, HttpResponse, get, post, put, web};
use mongodb::Client;
use serde::{Serialize, Deserialize};
use crate::auth::Sub;
use crate::course::{self, CourseStatus};
use crate::core::{self, *};
use crate::db;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    pub catalog : Option<bson::oid::ObjectId>, //TODO change type to DisplayCatalog
    pub degree_status: DegreeStatus,
    pub modified: bool,
}

impl UserDetails {
    pub fn get_mut_course_status(&mut self, number: u32) -> Option<&mut CourseStatus>{
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
    pub sub : String,
    pub details : Option<UserDetails>,
}

impl User {
    pub fn new_document(sub: &str) -> bson::Document {
        let user = User{
            sub : sub.into(),
            details: Some(UserDetails::default()),
        };
        // Should always unwrap succesfully here..
        bson::to_document(&user).unwrap_or(doc!{"sub" : sub, "details": null})
    }
    pub fn into_document(self) -> bson::Document {
        // Should always unwrap succesfully here..
        bson::to_document(&self).unwrap_or(doc!{"sub" : self.sub, "details": null})
    }
}

impl FromRequest for User {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let req = req.clone();
        Box::pin(async move {
            let client = match req.app_data::<web::Data<Client>>(){ 
                Some(client) => client,
                None => return Err(ErrorInternalServerError("Db client was not initialized!")),
            };
            match req.extensions().get::<Sub>() {
                Some(user_id) => {
                    db::services::get_user_by_id(user_id, &client)
                        .await
                        .map_err(|err| ErrorInternalServerError(err))
                },
                None => Err(ErrorUnauthorized("Authorization process did not complete successfully!"))
            }
        })
    }

    fn extract(req: &HttpRequest) -> Self::Future {
        Self::from_request(req, &mut Payload::None)
    }
}

#[post("/user/login")]
pub async fn user_login(
    client: web::Data<Client>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {

    let extensions = req.extensions();
    let user_id = extensions
        .get::<Sub>()
        .ok_or(ErrorInternalServerError("Middleware Internal Error"))?;

    let document = doc!{"$setOnInsert" : User::new_document(user_id)};
    db::services::find_and_update_user(user_id, document, &client).await
}

#[put("/user/catalog")]
pub async fn add_catalog(    
    client: web::Data<Client>, 
    catalog_id: String,
    mut user: User, 
) -> Result<HttpResponse, Error>{
    if let Some(details) = &mut user.details {
        details.catalog = Some(
            bson::oid::ObjectId::from_str(&catalog_id)
            .map_err(|err| ErrorInternalServerError(err))?
        );
        let user_id = user.sub.clone();
        let document = doc!{"$set" : user.into_document()}; 
        db::services::find_and_update_user(&user_id, document, &client).await?;
        Ok(HttpResponse::Ok().finish())
    }
    else{
        Err(ErrorInternalServerError("No data exists for user"))
    }
}

// here "modified" becomes true
#[post("/user/details")]
pub async fn update_user_details(
    client: web::Data<Client>,
    mut details: web::Json<UserDetails>,
    mut user: User,
) -> Result<HttpResponse, Error>{

    let user_id = user.sub.clone();
    details.modified = true;
    user.details = Some(details.into_inner());
    let document = doc!{"$set" : user.into_document()}; 
    db::services::find_and_update_user(&user_id, document, &client).await?;
    Ok(HttpResponse::Ok().finish())
}

// here "modified" becomes false
#[get("/user/compute")]
pub async fn compute_degree_status(
    client: web::Data<Client>,
    mut user: User, 
) -> Result<HttpResponse, Error>{
    
    let mut user_details = user
        .details
        .as_mut()
        .ok_or_else(||
             ErrorInternalServerError("No data exists for user")
        )?;

    let catalog_id = user_details
        .catalog
        .ok_or_else(||{
            ErrorInternalServerError("No data exists for user")
        })?;

    let catalog = db::services::get_catalog_by_id(&catalog_id, &client).await?;
    core::calculate_degree_status(&catalog, &mut user_details);
    user_details.modified = false;
    for course_status in user_details.degree_status.course_statuses.iter_mut() {
        // Fill in courses without information
        let course = &mut course_status.course;
        if course.name.is_empty(){
            *course = db::services::get_course_by_number(course.number, &client).await?;
        }
    }
    let user_id = user.sub.clone();
    let document = doc!{"$set" : user.clone().into_document()}; 
    db::services::find_and_update_user(&user_id, document, &client).await?;
    Ok(HttpResponse::Ok().json(user))
}

#[post("/user/ug_data")]
pub async fn add_data_from_ug(
    client: web::Data<Client>, 
    ug_data: String,
    mut user: User, 
) -> Result<HttpResponse, Error>{

    //course::validate_copy_paste_from_ug(&ug_data)?;
    let user_courses = course::parse_copy_paste_from_ug(&ug_data); //TODO if parsing fails -> 400
    // let user_courses_serialized = bson::to_bson(&user_courses).map_err(|err| {
    //     ErrorInternalServerError(err)})?;
    let user_id = user.sub.clone();
    if let Some(details) = &mut user.details {
        details.degree_status.course_statuses = user_courses;
        details.modified = true;
    }
    else{
        return Err(ErrorInternalServerError(""));
    }
    let db_name_from_profile = std::env::var("PROFILE").unwrap_or("debug".into());
    client
        .database(db_name_from_profile.as_str())
        .collection::<User>("Users")
        .find_one_and_update(
            doc!{"_id" : &user_id},
            doc!{ "$set" : user.into_document()},
            None    
        )
        .await
        .map_err(|err| ErrorInternalServerError(err))
        .map(|maybe_user| 
            match maybe_user {
                Some(user) => HttpResponse::Ok().body(format!("Successfully added ug data for {}", user.sub)),
                None => HttpResponse::InternalServerError().body(format!("User {} does not exist in the database", user_id)),
            }
        )
}

// DEBUG..

#[derive(Clone, Debug, Deserialize, Serialize)]
struct DebugResponse{
    s: String,
}
impl From<String> for DebugResponse {
    fn from(s: String) -> Self {
        DebugResponse{s}
    }
}

#[get("/user/debug")]
pub async fn debug(content: String) -> HttpResponse{
    HttpResponse::Ok().json(DebugResponse::from(content))
}

#[cfg(test)]
mod tests{
    
    use actix_rt::test;
    use actix_web::{App, test::{self}, web};
    use mongodb::Client;
    use dotenv::dotenv;
    use crate::{auth, user::User};

    #[test]
    async fn test_user_login(){
    
        std::env::set_var("RUST_LOG", "actix_server=info");
        env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
        dotenv().ok();
        let client = Client::with_uri_str(std::env::var("URI").unwrap()).await.expect("failed to connect");
    
        let mut app = test::init_service(
        App::new()
                .wrap(auth::AuthenticateMiddleware)
                .app_data(web::Data::new(client.clone()))
                .service(super::user_login)
        ).await;
    
        // Create and send request
        let resp = test::TestRequest::post()
            .uri("/user/login")
            .insert_header(("authorization", "bugo-the-debugo"))
            .send_request(&mut app)
            .await;
        
        assert!(resp.status().is_success());

        // Check for valid json response
        let user : User = test::read_body_json(resp).await;
        assert_eq!(user.sub, "bugo-the-debugo");
        assert!(user.details.is_some());
        assert_eq!(user.details.unwrap().degree_status.total_credit, 15.0);
    }
}