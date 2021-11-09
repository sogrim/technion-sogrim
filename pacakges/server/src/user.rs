use std::ops::Deref;

use mongodb::options::{FindOneAndUpdateOptions, ReturnDocument, UpdateModifications};
use rocket::{Request, http::{Cookie, SameSite}, request::{Outcome, FromRequest}, response::Redirect};
use crate::{course, db::{Connection, Db, doc}};
use crate::Status;
use crate::core::{self, *};
use crate::oauth2;

//TODO think about this!!!
pub struct UserEmail(pub String);

impl Deref for UserEmail{
    type Target = String;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for UserEmail {
    type Error = String;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {

        let auth_from_cookie = req.cookies()
            .get_private("email")
            .map(|cookie| UserEmail(cookie.value().into()));
        
        if auth_from_cookie.is_some(){
            return Outcome::Success(auth_from_cookie.unwrap());
        }

        match req.headers()
            .get_one("X-Auth-Token")
            .map(|token| oauth2::verify_jwt(String::from(token)))
            .map(|result| result
                .map(|user| UserEmail(user.email.into())
            )){
                Some(res) => match res {
                        Ok(user_email) => Outcome::Success(user_email),
                        Err(jwt_err) => Outcome::Failure((Status::Unauthorized, jwt_err.to_string())),
                    },
                None => Outcome::Failure((Status::BadRequest, "Missing X-Auth-Token header in HTTP request".into())),
            }
    }
}
pub struct Context;

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Context {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        req.cookies().add(Cookie::build("origin-req-uri", req.uri().path().to_string())
            .same_site(SameSite::Lax)
            .finish());
        Outcome::Success(Context)
    }
}

#[get("/user", rank = 2)]
pub async fn user_login_redirect(_ctx: Context) -> Redirect{
    Redirect::to(uri!("/login/github"))
}

#[get("/user/<_..>", rank = 3)]
pub async fn user_request_redirect(_ctx: Context) -> Redirect{
    Redirect::to(uri!("/login/github"))
}

#[get("/user")] 
pub async fn fetch_or_insert_user(conn: Connection<Db>, email: UserEmail) -> Result<String, Status> {

    let db_name_from_profile = std::env::var("ROCKET_PROFILE").unwrap_or("debug".into());
    let user_doc = doc!{
        "$setOnInsert" : {
            "email" : &email.0,
            "details" : null
        }
    };

    match conn.database(db_name_from_profile.as_str())
        .collection::<User>("Users")
        .find_one_and_update(
        doc!{"email" : &email.0}, 
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
        Ok(user) => {
            // We can safely unwrap 'user' thanks to upsert=true and ReturnDocument::After
            oauth2::generate_jwt(user.unwrap()) 
            .or_else(|jwt_err|{
                eprintln!("Failed to generate jwt for user: {}", jwt_err);
                Err(Status::InternalServerError)
            })
        }, 
        Err(err) => {
            eprintln!("{}", err);
            Err(Status::ServiceUnavailable)
        },
    }
}

#[get("/user/hello")]
pub async fn user_greet(user: User) -> String{
    format!("Hello {}, welcome to Sogrim!", user.email)
}

#[get("/user/compute")]
pub async fn compute_degree_status_for_user(user: User, conn: Connection<Db>) -> Result<(), Status>{
    core::calculate_degree_status(
        &mut user.details.ok_or_else(||{
            eprintln!("The user has not yet selected a catalog");
            Status::BadRequest
        })?, &conn
    ).await
}

#[post("/user/parse", data = "<ug_data>")]
pub async fn update_user_courses_from_ug(user: User, conn: Connection<Db>, ug_data: String) -> Result<(), Status>{

    course::validate_copy_paste_from_ug(&ug_data)?;
    let user_courses = course::parse_copy_paste_from_ug(&ug_data);
    let user_courses_serialized = bson::to_bson(&user_courses).map_err(|_| Status::InternalServerError)?;
    let db_name_from_profile = std::env::var("ROCKET_PROFILE").unwrap_or("debug".into());
    match conn
        .database(db_name_from_profile.as_str())
        .collection::<User>("Users")
        .find_one_and_update(
            doc!{"email" : user.email},
            doc!{ "$set" : {"details" : {"courses" : user_courses_serialized}}},
            None    
        )
        .await{
            Ok(_) => Ok(()),
            Err(err) => {
                eprintln!("{}", err);
                Err(Status::InternalServerError)
            },
        }
}