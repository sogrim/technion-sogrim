use crate::{
    core::types::Rule,
    resources::{catalog::Catalog, course::CourseState},
};

use super::DegreeStatus;

impl DegreeStatus {
    fn reset(&mut self, catalog: &mut Catalog) {
        self.course_bank_requirements.clear();
        self.overflow_msgs.clear();
        self.total_credit = 0.0;

        // before running the algorithm we remove all the courses added by the algorithm in the previous run to prevent duplication.
        // the algorithm adds courses only without semeser, unmodified, incomplete and to a bank from type "all"
        let bank_names = catalog.get_bank_names_by_rule(Rule::All);
        self.course_statuses.retain(|course_status| {
            if let Some(r#type) = &course_status.r#type {
                course_status.semester.is_some()
                    || course_status.modified
                    || course_status.passed()
                    || !bank_names.contains(r#type)
            } else {
                true
            }
        });

        // clear the type for unmodified and irrelevant courses
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

    pub fn preprocess(&mut self, catalog: &mut Catalog) {
        self.reset(catalog);
        self.remove_irrelevant_courses_from_catalog(catalog);
        self.course_statuses.sort_by(|c1, c2| {
            c1.extract_semester()
                .partial_cmp(&c2.extract_semester())
                .unwrap() // unwrap can't fail because we compare only integers or "half integers" (0.5,1,1.5,2,2.5...)
        });
    }
}
