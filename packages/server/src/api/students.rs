use std::{collections::HashMap, str::FromStr};

use actix_web::{
    get, post, put,
    web::{Data, Json, Query},
    HttpMessage, HttpRequest, HttpResponse,
};
use bson::DateTime;

use crate::{
    core::{degree_status::DegreeStatus, parser},
    db::{Db, FilterOption},
    error::AppError,
    middleware::auth::Sub,
    resources::{
        catalog::{Catalog, DisplayCatalog},
        course::{self, Course, CourseId},
        user::{User, UserDetails, UserSettings},
    },
};

#[get("/catalogs")]
pub async fn get_catalogs(
    _: User, //TODO think about whether this is necessary
    req: HttpRequest,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    let params = Query::<HashMap<String, String>>::from_query(req.query_string())
        .map_err(|e| AppError::BadRequest(e.to_string()))?;
    let catalogs = match params.iter().last() {
        Some((key, value)) => {
            db.get_filtered::<Catalog>(FilterOption::Regex, key, value)
                .await
        }
        None => db.get_all::<Catalog>().await,
    }?;
    Ok(HttpResponse::Ok().json(
        catalogs
            .into_iter()
            .map(DisplayCatalog::from)
            .collect::<Vec<DisplayCatalog>>(),
    ))
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

    let mut updated_user = db.create_or_update::<User>(user).await?;

    // Asynchronously update the user's last seen time
    let mut user = updated_user.clone();
    tokio::spawn(async move {
        // Don't update the user's last seen time if they've already been seen in the last hour
        const MILLIS_IN_HOUR: i64 = 3_600_000;
        if let Some(last_seen) = user.last_seen {
            if last_seen.timestamp_millis() + MILLIS_IN_HOUR > DateTime::now().timestamp_millis() {
                return Result::<(), AppError>::Ok(());
            }
        }
        user.last_seen = Some(DateTime::now());
        db.update::<User>(user).await?;
        Result::<(), AppError>::Ok(())
    });
    // Don't send the user's last seen time to the client
    updated_user.last_seen = None;

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

    let updated_user = db.update::<User>(user).await?;
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
                .get_filtered::<Course>(FilterOption::Regex, "name", name)
                .await?;
            Ok(HttpResponse::Ok().json(courses))
        }
        (None, Some(number)) => {
            let courses = db
                .get_filtered::<Course>(FilterOption::Regex, "_id", number)
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
    let updated_user = db.update::<User>(user).await?;
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

    let courses = db
        .get_filtered::<Course>(
            FilterOption::In,
            "_id",
            catalog
                .get_all_course_ids()
                .into_iter()
                .chain(
                    user.details
                        .degree_status
                        .course_statuses
                        .iter()
                        .map(|cs| cs.course.id.clone()),
                )
                .collect::<Vec<CourseId>>(),
        )
        .await?;

    user.details.degree_status.fill_tags(&courses);

    let mut course_list = Vec::new();
    if user.details.compute_in_progress {
        course_list = user.details.degree_status.set_in_progress_to_complete();
    }

    user.details
        .degree_status
        .compute(catalog, course::vec_to_map(courses));

    if user.details.compute_in_progress {
        user.details.degree_status.set_to_in_progress(course_list);
    }
    db.update::<User>(user.clone()).await?;
    Ok(HttpResponse::Ok().json(user))
}

// here "modified" is true
#[put("/students/details")]
pub async fn update_details(
    mut user: User,
    details: Json<UserDetails>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    user.details = details.into_inner();
    db.update::<User>(user).await?;
    Ok(HttpResponse::Ok().finish())
}

#[put("/students/settings")]
pub async fn update_settings(
    mut user: User,
    settings: Json<UserSettings>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    user.settings = settings.into_inner();
    db.update::<User>(user).await?;
    Ok(HttpResponse::Ok().finish())
}
