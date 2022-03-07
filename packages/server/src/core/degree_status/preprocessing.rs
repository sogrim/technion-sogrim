use crate::{
    core::types::Rule,
    resources::{catalog::Catalog, course::CourseState, user::UserDetails},
};

fn reset_type_for_unmodified_and_irrelevant_courses(user_details: &mut UserDetails) {
    for course_status in &mut user_details.degree_status.course_statuses {
        if !course_status.modified {
            course_status.r#type = None;
        } else if let Some(state) = &course_status.state {
            if *state == CourseState::Irrelevant {
                course_status.r#type = None;
            }
        }
    }
}

fn remove_courses_from_previous_runs(user_details: &mut UserDetails, catalog: &Catalog) {
    // before running the algorithm we remove all the courses added by the algorithm in the previous run to prevent duplication.
    // the algorithm adds courses only without semeser, unmodified, incomplete and to a bank from type "all"

    let bank_names = catalog.get_bank_names_by_rule(Rule::All);
    user_details
        .degree_status
        .course_statuses
        .retain(|course_status| {
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

fn remove_irrelevant_courses_from_catalog(user_details: &UserDetails, catalog: &mut Catalog) {
    for course_status in &user_details.degree_status.course_statuses {
        if let Some(state) = &course_status.state {
            if *state == CourseState::Irrelevant {
                catalog.course_to_bank.remove(&course_status.course.id);
            }
        }
    }
}

pub fn preprocess(user: &mut UserDetails, catalog: &mut Catalog) {
    remove_courses_from_previous_runs(user, catalog);
    reset_type_for_unmodified_and_irrelevant_courses(user);
    remove_irrelevant_courses_from_catalog(user, catalog);
    user.degree_status.course_statuses.sort_by(|c1, c2| {
        c1.extract_semester()
            .partial_cmp(&c2.extract_semester())
            .unwrap() // unwrap can't fail because we compare only integers or "half integers" (0.5,1,1.5,2,2.5...)
    });
}
