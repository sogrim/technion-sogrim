use crate::{
    core::types::Rule,
    resources::{catalog::Catalog, course::CourseState},
};

use super::DegreeStatus;

fn reset_type_for_unmodified_and_irrelevant_courses(degree_status: &mut DegreeStatus) {
    for course_status in &mut degree_status.course_statuses {
        if !course_status.modified {
            course_status.r#type = None;
        } else if let Some(state) = &course_status.state {
            if *state == CourseState::Irrelevant {
                course_status.r#type = None;
            }
        }
    }
}

fn remove_courses_from_previous_runs(degree_status: &mut DegreeStatus, catalog: &Catalog) {
    // before running the algorithm we remove all the courses added by the algorithm in the previous run to prevent duplication.
    // the algorithm adds courses only without semeser, unmodified, incomplete and to a bank from type "all"

    let bank_names = catalog.get_bank_names_by_rule(Rule::All);
    degree_status.course_statuses.retain(|course_status| {
        if let Some(r#type) = &course_status.r#type {
            course_status.semester.is_some()
                || course_status.modified
                || course_status.passed()
                || !bank_names.contains(r#type)
        } else {
            true
        }
    });
}

fn remove_irrelevant_courses_from_catalog(degree_status: &mut DegreeStatus, catalog: &mut Catalog) {
    for course_status in &degree_status.course_statuses {
        if let Some(state) = &course_status.state {
            if *state == CourseState::Irrelevant {
                catalog.course_to_bank.remove(&course_status.course.id);
            }
        }
    }
}

fn clear_degree_status_fields(degree_status: &mut DegreeStatus) {
    degree_status.course_bank_requirements.clear();
    degree_status.overflow_msgs.clear();
    degree_status.total_credit = 0.0;
}

pub fn preprocess(degree_status: &mut DegreeStatus, catalog: &mut Catalog) {
    remove_courses_from_previous_runs(degree_status, catalog);
    reset_type_for_unmodified_and_irrelevant_courses(degree_status);
    remove_irrelevant_courses_from_catalog(degree_status, catalog);
    clear_degree_status_fields(degree_status);
    degree_status.course_statuses.sort_by(|c1, c2| {
        c1.extract_semester()
            .partial_cmp(&c2.extract_semester())
            .unwrap() // unwrap can't fail because we compare only integers or "half integers" (0.5,1,1.5,2,2.5...)
    });
}
