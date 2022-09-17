use crate::{
    core::types::Rule,
    resources::{
        catalog::Catalog,
        course::{CourseId, CourseState},
    },
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
                    || course_status.completed()
                    || !bank_names.contains(r#type)
            } else {
                true
            }
        });

        // remove course which were added by the user, and were tagged as irrelevant in a previous run
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
                .unwrap_or(std::cmp::Ordering::Equal)
            // partial_cmp returns None if one of the two values are NaN, which should never happen
            // still, to be on the safe side, we use Ordering::Equal in that case instead of unwrapping
        });
    }
}
