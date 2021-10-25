use std::ops::Deref;

use mongodb::options::{FindOneAndUpdateOptions, ReturnDocument, UpdateModifications};
use rocket::{Request, http::{Cookie, SameSite}, outcome::IntoOutcome, request::{Outcome, FromRequest}, response::Redirect};
use crate::db::{Connection, Db, Json, doc};
use crate::Status;
use crate::core::{self, *};

//TODO think about this!!!
pub struct Username(pub String);

impl Deref for Username{
    type Target = String;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Username {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {

        req.cookies()
            .get_private("email")
            .map(|cookie| Username(cookie.value().into()))
            .or_forward(())
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

#[get("/user/<_..>")]
pub async fn user_request_redirect(_ctx: Context) -> Redirect{
    Redirect::to(uri!("/login/github"))
}

#[get("/user")] 
pub async fn fetch_or_insert_user(conn: Connection<Db>, username: Username) -> Result<Json<User>, Status> {
    
    match conn.database(std::env::var("ROCKET_PROFILE").unwrap_or("debug".into()).as_str())
        .collection::<User>("Users")
        .find_one_and_update(
        doc!{"name" : &username.0}, 
        UpdateModifications::Document(doc! { "$setOnInsert" : {"name" : &username.0, "details" : null}}), 
        Some(
                FindOneAndUpdateOptions::builder()
                .upsert(true)
                .return_document(ReturnDocument::After)
                .build()
            )
        )
        .await
    {
        Ok(user) => Ok(Json(user.unwrap())), // We can safely unwrap here thanks to upsert=true and ReturnDocument::After
        Err(err) => {
            eprintln!("{}", err);
            Err(Status::ServiceUnavailable)
        },
    }
}

#[get("/user/compute")]
pub async fn compute_degree_status_for_user(user: User, conn: Connection<Db>) -> Result<(), Status>{
    core::calculate_degree_status(
        &user.details.ok_or_else(||{
            eprintln!("The user has not yet selected a catalog");
            Status::BadRequest
        })?, &conn
    ).await
}

#[get("/user/hello")]
pub async fn user_greet(user: User) -> String{
    format!("Hello {}, welcome to Sogrim!", user.name)
}

//TODO this doesn't work right now
// #[post("/user/details", data = "<details>")]
// pub async fn update_user_details(conn: Connection<Db>, db_name : &State<String>, username: Username, details: Json<UserDetails>) -> Result<Json<User>, Status>{
    
//     //let username : String = "benny-n".into();

//     match conn.database(db_name)
//         .collection::<User>("Users")
//         .find_one_and_update(
//             doc!{"name" : &username.0}, 
//             UpdateModifications::Document(doc! { "$set" : {"details" : {"courses" : &details.courses}}}), 
//             Some(FindOneAndUpdateOptions::builder()
//                                                     .return_document(ReturnDocument::After)
//                                                     .build()))
//                                                     .await
//     {
//         Ok(user) => Ok(Json(user.ok_or(Status::NotFound)?)), 
//         Err(_) => Err(Status::ServiceUnavailable),
//     }
// }