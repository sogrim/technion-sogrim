use crate::{
    core::types::Rule,
    resources::{
        catalog::Catalog,
        course::{CourseId, CourseState},
    },
};

use super::DegreeStatus;

impl DegreeStatus {
    // before running the algorithm we remove all the courses added by the algorithm in the previous run to prevent duplications.
    // the algorithm adds courses only without semester, unmodified, incomplete and to a bank from type "All"
    fn remove_courses_added_by_algorithm(&mut self, catalog: &mut Catalog) {
        // get all courses from banks of type All
        let bank_names = catalog
            .course_banks
            .iter()
            .filter(|bank| bank.rule == Rule::All)
            .map(|bank| bank.name.clone())
            .collect::<Vec<_>>();

        self.course_statuses.retain(|course_status| {
            if let Some(r#type) = &course_status.r#type {
                course_status.semester.is_some()
                    || course_status.modified
                    || course_status.completed()
                    || !bank_names.contains(r#type)
            } else {
                true
            }
        });
    }

    // courses which were tagged as irrelevant in a previous run, and then user added the same courses (same course id) manually, should be removed
    fn remove_irrelevant_courses_added_by_user(&mut self) {
        let dispensable_irrelevant_courses = self
            .course_statuses
            .iter()
            .filter(|course_status| {
                if course_status.state != Some(CourseState::Irrelevant) {
                    return false;
                }
                for optional_relevant_duplicate in self.course_statuses.iter() {
                    if optional_relevant_duplicate.modified
                        && optional_relevant_duplicate.state != Some(CourseState::Irrelevant)
                        && optional_relevant_duplicate.course.id == course_status.course.id
                    {
                        return true;
                    }
                }
                false
            })
            .map(|course_status| course_status.course.id.clone())
            .collect::<Vec<CourseId>>();
        self.course_statuses.retain(|course_status| {
            course_status.state != Some(CourseState::Irrelevant)
                || !dispensable_irrelevant_courses.contains(&course_status.course.id)
        });
    }

    fn clear_type_for_unmodified_and_irrelevant_courses(&mut self) {
        for course_status in self.course_statuses.iter_mut() {
            if !course_status.modified {
                course_status.r#type = None;
            } else if let Some(state) = &course_status.state {
                if *state == CourseState::Irrelevant {
                    course_status.r#type = None;
                }
            }
        }
    }

    fn remove_irrelevant_courses_from_catalog(&mut self, catalog: &mut Catalog) {
        for course_status in self.course_statuses.iter() {
            if let Some(state) = &course_status.state {
                if *state == CourseState::Irrelevant {
                    catalog.course_to_bank.remove(&course_status.course.id);
                }
            }
        }
    }

    fn reset(&mut self, catalog: &mut Catalog) {
        self.course_bank_requirements.clear();
        self.overflow_msgs.clear();
        self.total_credit = 0.0;

        self.remove_courses_added_by_algorithm(catalog);
        self.remove_irrelevant_courses_added_by_user();
        self.clear_type_for_unmodified_and_irrelevant_courses();
        self.remove_irrelevant_courses_from_catalog(catalog);
    }

    pub fn preprocess(&mut self, catalog: &mut Catalog) {
        self.reset(catalog);

        self.course_statuses.sort_by(|c1, c2| {
            c1.extract_semester()
                .partial_cmp(&c2.extract_semester())
                .unwrap() // unwrap cannot fail because we compare only integers or "half integers" (0.5,1,1.5,2,2.5...)
        });
    }
}
