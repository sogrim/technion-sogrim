use std::{collections::HashMap, str::FromStr, sync::Arc};

use axum::{extract::Query, response::IntoResponse, Extension, Json};
use bson::DateTime;
use chrono::Datelike;
use http::StatusCode;

use crate::{
    core::{degree_status::DegreeStatus, parser_v2},
    db::{Db, FilterOption},
    disk_cache::DiskCourseCache,
    error::AppError,
    middleware::jwt_decoder::Sub,
    resources::{
        catalog::{Catalog, DisplayCatalog},
        course::Course,
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
    Extension(course_cache): Extension<Arc<DiskCourseCache>>,
) -> Result<impl IntoResponse, AppError> {
    let all_courses = course_cache.get_all_courses().await;
    let courses: Vec<Course> = match (params.get("name"), params.get("number")) {
        (Some(name), None) => {
            let pattern = name.to_lowercase();
            all_courses
                .into_values()
                .filter(|c| c.name.to_lowercase().contains(&pattern))
                .collect()
        }
        (None, Some(number)) => all_courses
            .into_values()
            .filter(|c| c.id.contains(number))
            .collect(),
        (Some(_), Some(_)) => return Err(AppError::BadRequest("Invalid query params".into())),
        (None, None) => return Err(AppError::BadRequest("Missing query params".into())),
    };
    Ok(Json(courses))
}

pub async fn add_courses(
    mut user: User,
    Extension(db): Extension<Db>,
    data: String,
) -> Result<impl IntoResponse, AppError> {
    user.details.degree_status = DegreeStatus::default();
    user.details.degree_status.course_statuses = parser_v2::parse_copy_paste_data(&data)?;
    user.details.modified = true;
    let updated_user = db.update::<User>(user).await?;
    Ok(Json(updated_user))
}

// here "modified" becomes false
pub async fn compute_degree_status(
    mut user: User,
    Extension(db): Extension<Db>,
    Extension(course_cache): Extension<Arc<DiskCourseCache>>,
) -> Result<impl IntoResponse, AppError> {
    let display_catalog = user
        .details
        .catalog
        .as_ref()
        .ok_or_else(|| AppError::InternalServer("No catalog chosen for user".into()))?;

    let catalog_id = display_catalog.id;

    // Extract track name from the display catalog.
    // Fetch all sibling catalogs (same track, last 6 years) in one query,
    // then find the chosen catalog among them and merge courses from the recent siblings.
    let track_name = Catalog::track_name_from_str(&display_catalog.name);
    let current_year = chrono::Utc::now().year() as usize;
    let min_year = current_year.saturating_sub(6);

    let (mut catalog, recent_siblings) = if !track_name.is_empty() {
        let all_catalogs = db
            .get_filtered::<Catalog>(FilterOption::Regex, "name", &track_name)
            .await
            .unwrap_or_default();

        let mut chosen = None;
        let mut recent: Vec<Catalog> = Vec::new();
        for catalog in all_catalogs {
            if catalog.id == catalog_id {
                chosen = Some(catalog);
            } else if catalog.year() >= min_year {
                recent.push(catalog);
            }
        }

        match chosen {
            Some(c) => (c, recent),
            // Chosen catalog is not among siblings (e.g., older than 6 years) — fetch separately
            None => (db.get::<Catalog>(&catalog_id).await?, recent),
        }
    } else {
        (db.get::<Catalog>(&catalog_id).await?, Vec::new())
    };

    catalog.enrich_with_sibling_courses(&recent_siblings);

    user.details.modified = false;

    let mut courses = course_cache.get_all_courses().await;
    // Insert student courses only if not already present in the cache
    for cs in &user.details.degree_status.course_statuses {
        courses
            .entry(cs.course.id.clone())
            .or_insert_with(|| cs.course.clone());
    }

    let courses_vec: Vec<Course> = courses.values().cloned().collect();
    user.details.degree_status.fill_tags(&courses_vec);

    let mut course_list = Vec::new();
    if user.details.compute_in_progress {
        course_list = user.details.degree_status.set_in_progress_to_complete();
    }

    user.details.degree_status.compute(catalog, courses);

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
