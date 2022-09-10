use std::{collections::HashMap, str::FromStr};

use actix_web::{
    get, post, put,
    web::{Data, Json, Query},
    HttpMessage, HttpRequest, HttpResponse,
};
use bson::doc;

use crate::{
    core::{degree_status::DegreeStatus, parser},
    db,
    error::AppError,
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
) -> Result<HttpResponse, AppError> {
    db::services::get_all_catalogs(&client)
        .await
        .map(|catalogs| HttpResponse::Ok().json(catalogs))
}

//TODO: maybe this should be "PUT" because it will ALWAYS create a user if one doesn't exist?
#[get("/students/login")]
pub async fn login(
    client: Data<mongodb::Client>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let extensions = req.extensions();
    let user_id = extensions
        .get::<Sub>()
        .ok_or_else(|| AppError::Middleware("No sub found in request extensions".into()))?;

    let document = doc! {"$setOnInsert" : User::new_document(user_id)};
    let updated_user = db::services::find_and_update_user(user_id, document, &client).await?;
    Ok(HttpResponse::Ok().json(updated_user))
}

#[put("/students/catalog")]
pub async fn add_catalog(
    mut user: User,
    catalog_id: String,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    match &mut user.details {
        Some(details) => {
            let obj_id = bson::oid::ObjectId::from_str(&catalog_id)
                .map_err(|e| AppError::Bson(e.to_string()))?;
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
        None => Err(AppError::InternalServer("No data exists for user".into())),
    }
}

#[get("/students/courses")]
pub async fn get_courses_by_filter(
    _: User,
    req: HttpRequest,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    let params = Query::<HashMap<String, String>>::from_query(req.query_string())
        .map_err(|e| AppError::BadRequest(e.to_string()))?;
    match (params.get("name"), params.get("number")) {
        (Some(name), None) => {
            let courses = db::services::get_courses_by_name(name, &client).await?;
            Ok(HttpResponse::Ok().json(courses))
        }
        (None, Some(number)) => {
            let courses = db::services::get_courses_by_number(number, &client).await?;
            Ok(HttpResponse::Ok().json(courses))
        }
        (Some(_), Some(_)) => Err(AppError::BadRequest("Invalid query params".into())),
        (None, None) => Err(AppError::BadRequest("Missing query params".into())),
    }
}

#[post("/students/courses")]
pub async fn add_courses(
    mut user: User,
    data: String,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
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
        None => Err(AppError::InternalServer("No data exists for user".into())),
    }
}

// here "modified" becomes false
#[get("/students/degree-status")]
pub async fn compute_degree_status(
    mut user: User,
    client: Data<mongodb::Client>,
) -> Result<HttpResponse, AppError> {
    let mut user_details = user
        .details
        .as_mut()
        .ok_or_else(|| AppError::InternalServer("No data exists for user".into()))?;

    let catalog_id = user_details
        .catalog
        .as_ref()
        .ok_or_else(|| AppError::InternalServer("No catalog chosen for user".into()))?
        .id;

    let catalog = db::services::get_catalog_by_id(&catalog_id, &client).await?;

    user_details.modified = false;

    let vec_courses =
        db::services::get_courses_by_ids(catalog.get_all_course_ids(), &client).await?;
    let malag_courses = db::services::get_all_malags(&client).await?[0]
        .malag_list
        .clone(); // The collection malags contain one item with the list of all malags

    let mut course_list = Vec::new();
    if user.settings.compute_in_progress {
        course_list = user_details.degree_status.set_in_progress_to_complete();
    }

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
) -> Result<HttpResponse, AppError> {
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
) -> Result<HttpResponse, AppError> {
    let user_id = user.sub.clone();
    user.settings = settings.into_inner();
    let document = doc! {"$set" : user.into_document()};
    db::services::find_and_update_user(&user_id, document, &client).await?;
    Ok(HttpResponse::Ok().finish())
}
