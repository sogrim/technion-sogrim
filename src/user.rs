use std::ops::Deref;

use mongodb::options::{FindOneAndUpdateOptions, ReturnDocument, UpdateModifications};
use rocket::{Request, http::{Cookie, SameSite}, outcome::IntoOutcome, request::{Outcome, FromRequest}, response::Redirect};
use crate::db::{Connection, Db, Json, doc};
use crate::{State, Status};

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct UserDetails{
    courses: Vec<u32>,
}
    
#[derive(Default, Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct User {
    _id : bson::oid::ObjectId,
    name: String,
    details : Option<UserDetails>,
}
//TODO think about this!!!
pub struct Username(String);

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
            .get_private("username")
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
pub async fn fetch_or_insert_user(conn: Connection<Db>, db_name : &State<String>, username: Username) -> Result<Json<User>, Status> {
    
    match conn.database(db_name)
        .collection::<User>("Users")
        .find_one_and_update(
            doc!{"name" : &username.0}, 
            UpdateModifications::Document(doc! { "$setOnInsert" : {"name" : &username.0, "details" : null}}), 
            Some(FindOneAndUpdateOptions::builder()
                                                    .upsert(true)
                                                    .return_document(ReturnDocument::After)
                                                    .build()))
                                                    .await
    {
        Ok(user) => Ok(Json(user.unwrap())), // We can safely unwrap here thanks to upsert=true and ReturnDocument::After
        Err(_) => Err(Status::ServiceUnavailable),
    }
}

#[get("/user/hello")]
pub async fn user_greet(username: Username) -> String{
    format!("Hello {}, welcome to Sogrim!", username.0)
}

#[post("/user/details", data = "<details>")]
pub async fn update_user_details(conn: Connection<Db>, db_name : &State<String>, username: Username, details: Json<UserDetails>) -> Result<Json<User>, Status>{
    
    //let username : String = "benny-n".into();

    match conn.database(db_name)
        .collection::<User>("Users")
        .find_one_and_update(
            doc!{"name" : &username.0}, 
            UpdateModifications::Document(doc! { "$set" : {"details" : {"courses" : &details.courses}}}), 
            Some(FindOneAndUpdateOptions::builder()
                                                    .return_document(ReturnDocument::After)
                                                    .build()))
                                                    .await
    {
        Ok(user) => Ok(Json(user.ok_or(Status::NotFound)?)), 
        Err(_) => Err(Status::ServiceUnavailable),
    }
}