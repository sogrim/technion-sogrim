use std::pin::Pin;
use actix_web::dev::Payload;
use actix_web::error::{ErrorInternalServerError, ErrorUnauthorized};
use bson::{Document, doc};
use futures_util::Future;
use actix_web::{Error, FromRequest, HttpRequest, HttpResponse, get, post, web};
use mongodb::Client;
use mongodb::options::{FindOneAndUpdateOptions, ReturnDocument, UpdateModifications};
use serde::{Serialize, Deserialize};
use crate::course::{self, CourseStatus};
use crate::core::{self, *};
use crate::{auth, db};

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct UserDetails {
    //pub course_statuses: Vec<CourseStatus>, //from parser
    pub catalog : Option<bson::oid::ObjectId>,
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
        doc!{
            "$setOnInsert" : {
                "_id" : sub,
                "details" : doc!{
                    "course_statuses": null,
                    "catalog": null,
                    "degree_status": null,
                    "modified": false,
                }
            }
        }
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
            match req.extensions().get::<String>() {
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
    req_payload: String,
) -> Result<HttpResponse, Error> {

    let token = req_payload.as_str();
    let user_id = token;
    // let user_id: &str = &auth::get_decoded(token)
    //     .await
    //     .map_err(|err| ErrorInternalServerError(err.to_string()))?
    //     .sub;
        
    let user_doc = User::new_document(user_id);

    match client.database(std::env::var("PROFILE").unwrap_or("debug".into()).as_str())
        .collection::<Document>("Users")
        .find_one_and_update(
        doc!{"_id" : user_id}, 
        UpdateModifications::Document(user_doc), 
        Some(
                FindOneAndUpdateOptions::builder()
                .upsert(true)
                .return_document(ReturnDocument::After)
                .build()
            )
        )
        .await
    {
        // We can safely unwrap here thanks to upsert=true and ReturnDocument::After
        Ok(user) => Ok(HttpResponse::Ok().json(user.unwrap())),
        Err(err) => {
            let err = format!("monogdb driver error: {}", err);
            eprintln!("{}", err);
            Err(ErrorInternalServerError(err.to_string()))
        },
    }
}

#[cfg(test)]
mod tests{

    use actix_web::{App, body::AnyBody, test::{self, TestRequest}, web::{self}};
    use mongodb::Client;
    use crate::{user::User};

    #[actix_rt::test]
    async fn test_user_login(){
    
        std::env::set_var("RUST_LOG", "actix_server=info");
        env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
        let client = Client::with_uri_str("mongodb+srv://nbl_admin:sm3sw0rFjzMcQeW3@sogrimdev.7tmyn.mongodb.net/Development?retryWrites=true&w=majority").await.expect("failed to connect");
    
        let app = test::init_service(
        App::new()
                .app_data(web::Data::new(client.clone()))
                .service(super::user_login)
        ).await;
    
        // Create request object
        let req = TestRequest::post()
            .uri("/user/login")
            .set_payload( "bigo-the-debigo")
            .to_request();
    
        // Call application
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
        if let AnyBody::Bytes(b)= resp.into_body() {
            //TODO probably should eradicate this and make degree status an option..
            if let Ok(user) = serde_json::from_slice::<User>(&b){
                println!("logged in: {:#?}", user);
            }
            else{
                println!("not logged in: {:#?}", std::str::from_utf8(&b));
            }
        }
    }
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


// here "modified" becomes true
// #[post("/user/details")]
// pub async fn update_user_details(){
//     todo!()
// }

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

    for course_status in user_details.degree_status.course_statuses.iter_mut() {
        // Fill in courses without information
        let course = &mut course_status.course;
        if course.name.is_empty(){
            *course = db::services::get_course_by_number(course.number, &client).await?;
        }
    }

    Ok(HttpResponse::Ok().finish())
}

//create new file catalog.rs and move this function there
// #[get("/catalogs")]
// pub async fn get_all_catalogs(){todo!()}

// #[post("/user/catalog")]
// pub async fn add_catalog(){todo!()}

#[post("/user/ug_data")]
pub async fn add_data_from_ug(
    client: web::Data<Client>, 
    user: User, 
    ug_data: String
) -> Result<HttpResponse, Error>{

    course::validate_copy_paste_from_ug(&ug_data)?;
    let user_courses = course::parse_copy_paste_from_ug(&ug_data);
    let user_courses_serialized = bson::to_bson(&user_courses).map_err(|err| ErrorInternalServerError(err))?;
    let db_name_from_profile = std::env::var("ROCKET_PROFILE").unwrap_or("debug".into());
    client
        .database(db_name_from_profile.as_str())
        .collection::<User>("Users")
        .find_one_and_update(
            doc!{"_id" : &user.sub},
            doc!{ "$set" : {"details" : {"course_statuses" : user_courses_serialized}}},
            None    
        )
        .await
        .map_err(|err| ErrorInternalServerError(err))
        .map(|maybe_user| 
            match maybe_user {
                Some(user) => HttpResponse::Ok().body(format!("Successfully added ug data for {}", user.sub)),
                None => HttpResponse::InternalServerError().body(format!("User {} does not exist in the database", user.sub)),
            }
        )
}