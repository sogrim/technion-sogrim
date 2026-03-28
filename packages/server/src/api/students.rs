use std::{collections::HashMap, str::FromStr};

use axum::{extract::Query, response::IntoResponse, Extension, Json};
use bson::DateTime;
use http::StatusCode;

use crate::{
    core::{degree_status::DegreeStatus, parser},
    db::{Db, FilterOption},
    error::AppError,
    middleware::jwt_decoder::Sub,
    resources::{
        catalog::{Catalog, DisplayCatalog},
        course::{self, Course, CourseId},
        user::{TimetableState, User, UserDetails, UserSettings},
    },
};

pub async fn get_catalogs(
    _: User, //TODO think about whether this is necessary
    Query(params): Query<HashMap<String, String>>,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    let catalogs = match params.iter().last() {
        Some((key, value)) => {
            db.get_filtered::<Catalog>(FilterOption::Regex, key, value)
                .await
        }
        None => db.get_all::<Catalog>().await,
    }?;
    Ok(Json(
        catalogs
            .into_iter()
            .map(DisplayCatalog::from)
            .collect::<Vec<DisplayCatalog>>(),
    ))
}

//TODO: maybe this should be "PUT" because it will ALWAYS create a user if one doesn't exist?
pub async fn login(
    Extension(db): Extension<Db>,
    Extension(sub): Extension<Sub>,
) -> Result<impl IntoResponse, AppError> {
    let user = User {
        sub,
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

    Ok(Json(updated_user))
}

pub async fn update_catalog(
    mut user: User,
    Extension(db): Extension<Db>,
    catalog_id: String,
) -> Result<impl IntoResponse, AppError> {
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
    Ok(Json(updated_user))
}

pub async fn get_courses_by_filter(
    _: User,
    Query(params): Query<HashMap<String, String>>,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
    match (params.get("name"), params.get("number")) {
        (Some(name), None) => {
            let courses = db
                .get_filtered::<Course>(FilterOption::Regex, "name", name)
                .await?;
            Ok(Json(courses))
        }
        (None, Some(number)) => {
            let courses = db
                .get_filtered::<Course>(FilterOption::Regex, "_id", number)
                .await?;
            Ok(Json(courses))
        }
        (Some(_), Some(_)) => Err(AppError::BadRequest("Invalid query params".into())),
        (None, None) => Err(AppError::BadRequest("Missing query params".into())),
    }
}

pub async fn add_courses(
    mut user: User,
    Extension(db): Extension<Db>,
    data: String,
) -> Result<impl IntoResponse, AppError> {
    user.details.degree_status = DegreeStatus::default();
    user.details.degree_status.course_statuses = parser::parse_copy_paste_data(&data)?;
    user.details.modified = true;
    let updated_user = db.update::<User>(user).await?;
    Ok(Json(updated_user))
}

// here "modified" becomes false
pub async fn compute_degree_status(
    mut user: User,
    Extension(db): Extension<Db>,
) -> Result<impl IntoResponse, AppError> {
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
    Ok(Json(user))
}

// here "modified" is true
pub async fn update_details(
    mut user: User,
    Extension(db): Extension<Db>,
    Json(details): Json<UserDetails>,
) -> Result<impl IntoResponse, AppError> {
    user.details = details;
    db.update::<User>(user).await?;
    Ok(StatusCode::OK)
}

pub async fn update_settings(
    mut user: User,
    Extension(db): Extension<Db>,
    Json(settings): Json<UserSettings>,
) -> Result<impl IntoResponse, AppError> {
    user.settings = settings;
    db.update::<User>(user).await?;
    Ok(StatusCode::OK)
}

pub async fn get_timetable(user: User) -> Result<impl IntoResponse, AppError> {
    Ok(Json(user.timetable))
}

pub async fn update_timetable(
    mut user: User,
    Extension(db): Extension<Db>,
    Json(timetable): Json<TimetableState>,
) -> Result<impl IntoResponse, AppError> {
    user.timetable = timetable;
    db.update::<User>(user).await?;
    Ok(StatusCode::OK)
}
