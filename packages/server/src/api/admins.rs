use crate::core::degree_status::DegreeStatus;
use crate::core::parser;
use crate::db::{Db, FilterOption};
use crate::error::AppError;
use crate::resources::catalog::Catalog;
use crate::resources::course::CourseId;
use crate::resources::course::{self, Course};
use crate::resources::user::User;
use actix_web::web::{Data, Json};
use actix_web::{post, HttpResponse};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComputeDegreeStatusPayload {
    pub catalog_id: bson::oid::ObjectId,
    pub grade_sheet_as_string: String,
}

#[post("/admins/parse-compute")]
pub async fn parse_courses_and_compute_degree_status(
    _: User,
    payload: Json<ComputeDegreeStatusPayload>,
    db: Data<Db>,
) -> Result<HttpResponse, AppError> {
    let payload = payload.into_inner();
    let catalog = db.get::<Catalog>(payload.catalog_id).await?;
    let course_statuses = parser::parse_copy_paste_data(&payload.grade_sheet_as_string)?;
    let mut degree_status = DegreeStatus {
        course_statuses,
        ..Default::default()
    };
    let courses = db
        .get_filtered::<Course>(
            FilterOption::In,
            "_id",
            catalog
                .get_all_course_ids()
                .into_iter()
                .chain(
                    degree_status
                        .course_statuses
                        .iter()
                        .map(|cs| cs.course.id.clone()),
                )
                .collect::<Vec<CourseId>>(),
        )
        .await?;

    // Fill tags for all student courses
    degree_status
        .course_statuses
        .iter_mut()
        .for_each(|course_status| {
            course_status.course.tags = courses
                .iter()
                .find(|course| course.id == course_status.course.id)
                .and_then(|course| course.tags.clone());
        });

    degree_status.compute(catalog, course::vec_to_map(courses));

    Ok(HttpResponse::Ok().json(degree_status))
}
