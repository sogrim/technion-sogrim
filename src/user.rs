use mongodb::options::{FindOneAndUpdateOptions, ReturnDocument, UpdateModifications};
use crate::db::{Connection, Db, Json, doc};
use crate::{State, CookieJar, Status};

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

#[get("/user/<user>")] //remove <user> on production
pub async fn fetch_or_insert_user(conn: Connection<Db>, db_name : &State<String>, cookies: &CookieJar<'_>, user : &str) -> Result<Json<User>, Status> {
    let token = cookies.get_private("username");
    let username : String;
    match token{
        Some(cookie) => {
            username = cookie.to_string().strip_prefix("username=").unwrap().into();
        },
        None => /*return Err(Status::InternalServerError),*/ username = user.to_string(), //uncomment on production
    }
    
    match conn.database(db_name)
        .collection::<User>("Users")
        .find_one_and_update(
            doc!{"name" : &username}, 
            UpdateModifications::Document(doc! { "$setOnInsert" : {"name" : &username, "details" : null}}), 
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