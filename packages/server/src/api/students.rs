use std::{collections::HashMap, str::FromStr};

use actix_web::{
    get, post, put,
    web::{Data, Json, Query},
    HttpMessage, HttpRequest, HttpResponse,
};
use bson::{doc, to_bson};

use crate::{
    core::{degree_status::DegreeStatus, parser},
    db::{Db, FilterType},
    error::AppError,
    middleware::auth::Sub,
    resources::{
        catalog::{Catalog, DisplayCatalog},
        course::{self, Course, Malags},
        user::{User, UserDetails, UserSettings},
    },
};

#[get("/catalogs")]
pub async fn get_all_catalogs(
    _: User, //TODO think about whether this is necessary
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    db.get_all::<Catalog>().await.map(|catalogs| {
        HttpResponse::Ok().json(
            catalogs
                .into_iter()
                .map(DisplayCatalog::from)
                .collect::<Vec<DisplayCatalog>>(),
        )
    })
}

//TODO: maybe this should be "PUT" because it will ALWAYS create a user if one doesn't exist?
#[get("/students/login")]
pub async fn login(db: Data<Db>, req: HttpRequest) -> Result<HttpResponse, AppError> {
    let user_id = req
        .extensions()
        .get::<Sub>()
        .cloned()
        .ok_or_else(|| AppError::Middleware("No sub found in request extensions".into()))?;
    let user = User {
        sub: user_id,
        ..Default::default()
    };
    let document = doc! {"$setOnInsert" : to_bson(&user)?};

    let updated_user = db.update::<User>(&user.sub, document).await?;

    Ok(HttpResponse::Ok().json(updated_user))
}

#[put("/students/catalog")]
pub async fn update_catalog(
    mut user: User,
    catalog_id: String,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    let obj_id = bson::oid::ObjectId::from_str(&catalog_id)?;
    let catalog = db.get::<Catalog>(&obj_id).await?;
    user.details.catalog = Some(DisplayCatalog::from(catalog));
    user.details.modified = true;

    // Updating the catalog renders the current course types invalid in the new catalog's context,
    // so we need to clear them out and let the algorithm recompute them
    user.details
        .degree_status
        .course_statuses
        .iter_mut()
        .for_each(|cs| {
            cs.r#type = None;
            cs.specialization_group_name = None;
            cs.additional_msg = None;
        });

    let updated_user = db
        .update::<User>(&user.sub.clone(), doc! {"$set" : to_bson(&user)?})
        .await?;
    Ok(HttpResponse::Ok().json(updated_user))
}

#[get("/students/courses")]
pub async fn get_courses_by_filter(
    _: User,
    req: HttpRequest,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    let params = Query::<HashMap<String, String>>::from_query(req.query_string())
        .map_err(|e| AppError::BadRequest(e.to_string()))?;
    match (params.get("name"), params.get("number")) {
        (Some(name), None) => {
            let courses = db
                .get_filtered::<Course>(name, FilterType::Regex, "name")
                .await?;
            Ok(HttpResponse::Ok().json(courses))
        }
        (None, Some(number)) => {
            let courses = db
                .get_filtered::<Course>(number, FilterType::Regex, "_id")
                .await?;
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
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    user.details.degree_status = DegreeStatus::default();
    user.details.degree_status.course_statuses = parser::parse_copy_paste_data(&data)?;
    user.details.modified = true;
    let updated_user = db
        .update::<User>(&user.sub.clone(), doc! {"$set" : to_bson(&user)?})
        .await?;
    Ok(HttpResponse::Ok().json(updated_user))
}

// here "modified" becomes false
#[get("/students/degree-status")]
pub async fn compute_degree_status(mut user: User, db: Data<Db>) -> Result<HttpResponse, AppError> {
    let catalog_id = user
        .details
        .catalog
        .as_ref()
        .ok_or_else(|| AppError::InternalServer("No catalog chosen for user".into()))?
        .id;

    let catalog = db.get::<Catalog>(&catalog_id).await?;

    user.details.modified = false;

    let vec_courses = db
        .get_filtered::<Course>(catalog.get_all_course_ids(), FilterType::In, "_id")
        .await?;

    // The collection "Malags" should contain a single document with the list of all malags
    let malag_course_ids = db
        .get_all::<Malags>()
        .await?
        .into_iter()
        .last() // Safer then indexing because it won't panic if the collection is empty
        .map(|obj| obj.malag_list)
        .unwrap_or_default();

    let mut course_list = Vec::new();
    if user.settings.compute_in_progress {
        course_list = user.details.degree_status.set_in_progress_to_complete();
    }

    user.details
        .degree_status
        .compute(catalog, course::vec_to_map(vec_courses), malag_course_ids);

    if user.settings.compute_in_progress {
        user.details.degree_status.set_to_in_progress(course_list);
    }
    let user_id = user.sub.clone();
    let document = doc! {"$set" : to_bson(&user)?};
    db.update::<User>(&user_id, document).await?;
    Ok(HttpResponse::Ok().json(user))
}

// here "modified" is true
#[put("/students/details")]
pub async fn update_details(
    mut user: User,
    details: Json<UserDetails>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    let user_id = user.sub.clone();
    user.details = details.into_inner();
    let document = doc! {"$set" : to_bson(&user)?};
    db.update::<User>(&user_id, document).await?;
    Ok(HttpResponse::Ok().finish())
}

#[put("/students/settings")]
pub async fn update_settings(
    mut user: User,
    settings: Json<UserSettings>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    let user_id = user.sub.clone();
    user.settings = settings.into_inner();
    user.details.modified = true; // Hack - TODO: increase level of modified to User (instead of UserDetails)
    let document = doc! {"$set" : to_bson(&user)?};
    db.update::<User>(&user_id, document).await?;
    Ok(HttpResponse::Ok().finish())
}
