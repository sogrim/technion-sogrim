use std::{collections::HashMap, str::FromStr};

use actix_web::{
    error::{ErrorBadRequest, ErrorInternalServerError},
    get, post, put,
    web::{Data, Json, Query},
    Error, HttpMessage, HttpRequest, HttpResponse,
};
use bson::doc;

use crate::{
    core::{degree_status::DegreeStatus, parser},
    db,
    middleware::auth::Sub,
    resources::{
        catalog::DisplayCatalog,
        course,
        user::{User, UserDetails, UserSettings},
    },
};

#[get("/catalogs")]
pub async fn get_all_catalogs(
    _: User, //TODO think about whether this is necessary
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, Error> {
    db::services::get_all_catalogs(&client)
        .await
        .map(|catalogs| HttpResponse::Ok().json(catalogs))
}

//TODO: maybe this should be "PUT" because it will ALWAYS create a user if one doesn't exist?
#[get("/students/login")]
pub async fn login(client: Data<mongodb::Client>, req: HttpRequest) -> Result<HttpResponse, Error> {
    let extensions = req.extensions();
    let user_id = extensions.get::<Sub>().ok_or_else(|| {
        log::error!("Middleware Internal Error: No sub found in request extensions");
        ErrorInternalServerError("Middleware Internal Error: No sub found in request extensions")
    })?;

    let document = doc! {"$setOnInsert" : User::new_document(user_id)};
    let updated_user = db::services::find_and_update_user(user_id, document, &client).await?;
    Ok(HttpResponse::Ok().json(updated_user))
}

#[put("/students/catalog")]
pub async fn add_catalog(
    mut user: User,
    catalog_id: String,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, Error> {
    match &mut user.details {
        Some(details) => {
            let obj_id =
                bson::oid::ObjectId::from_str(&catalog_id).map_err(ErrorInternalServerError)?;
            let catalog = db::services::get_catalog_by_id(&obj_id, &client).await?;
            details.catalog = Some(DisplayCatalog::from(catalog));
            details.degree_status = DegreeStatus::default();
            details.modified = true;
            let updated_user = db::services::find_and_update_user(
                &user.sub.clone(),
                doc! {"$set" : user.into_document()},
                &client,
            )
            .await?;
            Ok(HttpResponse::Ok().json(updated_user))
        }
        None => {
            log::error!("No data exists for user");
            Err(ErrorInternalServerError("No data exists for user"))
        }
    }
}

#[get("/students/courses")]
pub async fn get_courses_by_filter(
    _: User,
    req: HttpRequest,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, Error> {
    let params = Query::<HashMap<String, String>>::from_query(req.query_string())
        .map_err(|e| ErrorBadRequest(e.to_string()))?;
    match (params.get("name"), params.get("number")) {
        (Some(name), None) => {
            let courses = db::services::get_all_courses_by_name(name, &client).await?;
            Ok(HttpResponse::Ok().json(courses))
        }
        (None, Some(number)) => {
            let courses = db::services::get_all_courses_by_number(number, &client).await?;
            Ok(HttpResponse::Ok().json(courses))
        }
        (Some(_), Some(_)) => {
            log::error!("Invalid query params");
            Err(ErrorBadRequest("Invalid query params"))
        }
        (None, None) => {
            log::error!("Missing query params");
            Err(ErrorBadRequest("Missing query params"))
        }
    }
}

#[post("/students/courses")]
pub async fn add_courses(
    mut user: User,
    data: String,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, Error> {
    match &mut user.details {
        Some(details) => {
            details.degree_status = DegreeStatus::default();
            details.degree_status.course_statuses = parser::parse_copy_paste_data(&data)?;
            details.modified = true;
            let updated_user = db::services::find_and_update_user(
                &user.sub.clone(),
                doc! {"$set" : user.into_document()},
                &client,
            )
            .await?;
            Ok(HttpResponse::Ok().json(updated_user))
        }
        None => {
            log::error!("No data exists for user");
            Err(ErrorInternalServerError("No data exists for user"))
        }
    }
}

// here "modified" becomes false
#[get("/students/degree-status")]
pub async fn compute_degree_status(
    mut user: User,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, Error> {
    let mut user_details = user.details.as_mut().ok_or_else(|| {
        log::error!("No data exists for user");
        ErrorInternalServerError("No data exists for user")
    })?;

    let catalog_id = user_details
        .catalog
        .as_ref()
        .ok_or_else(|| {
            log::error!("No catalog chosen for user");
            ErrorInternalServerError("No catalog chosen for user")
        })?
        .id;

    let catalog = db::services::get_catalog_by_id(&catalog_id, &client).await?;

    user_details.modified = false;

    let vec_courses = db::services::get_all_courses(&client).await?;
    let malag_courses = db::services::get_all_malags(&client).await?[0]
        .malag_list
        .clone(); // The collection malags contain one item with the list of all malags

    let mut course_list = Vec::new();
    if user.settings.compute_in_progress {
        course_list = user_details.degree_status.set_in_progress_to_complete();
    }

    println!("{:#?}", course_list);

    user_details
        .degree_status
        .compute(catalog, course::vec_to_map(vec_courses), malag_courses);

    if user.settings.compute_in_progress {
        user_details.degree_status.set_to_in_progress(course_list);
    }
    let user_id = user.sub.clone();
    let document = doc! {"$set" : user.clone().into_document()};
    db::services::find_and_update_user(&user_id, document, &client).await?;
    Ok(HttpResponse::Ok().json(user))
}

// here "modified" is true
#[put("/students/details")]
pub async fn update_details(
    mut user: User,
    details: Json<UserDetails>,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, Error> {
    let user_id = user.sub.clone();
    user.details = Some(details.into_inner());
    let document = doc! {"$set" : user.into_document()};
    db::services::find_and_update_user(&user_id, document, &client).await?;
    Ok(HttpResponse::Ok().finish())
}

#[put("/students/settings")]
pub async fn update_settings(
    mut user: User,
    settings: Json<UserSettings>,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, Error> {
    let user_id = user.sub.clone();
    user.settings = settings.into_inner();
    let document = doc! {"$set" : user.into_document()};
    db::services::find_and_update_user(&user_id, document, &client).await?;
    Ok(HttpResponse::Ok().finish())
}
