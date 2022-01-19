use std::collections::HashMap;

use crate::resources::{
    catalog::OptionalReplacements,
    course::{Course, CourseId, CourseState, CourseStatus},
    user::UserDetails,
};

use super::{
    messages,
    types::{Chain, CreditInfo, SpecializationGroups},
};

pub struct BankRuleHandler<'a> {
    pub user: &'a mut UserDetails,
    pub bank_name: String,
    pub course_list: Vec<CourseId>,
    pub courses: &'a HashMap<CourseId, Course>,
    pub credit_overflow: f32,
    pub courses_overflow: u32,
    pub catalog_replacements: &'a HashMap<CourseId, OptionalReplacements>,
    pub common_replacements: &'a HashMap<CourseId, OptionalReplacements>,
}

impl<'a> BankRuleHandler<'a> {
    // This function sets the type of the course and adds its credit to sum_credits.
    // Returns true if the credits have been added, false otherwise.
    pub fn set_type_and_add_credits(
        course_status: &mut CourseStatus,
        bank_name: String,
        sum_credits: &mut f32,
    ) -> bool {
        course_status.set_type(bank_name);
        if course_status.passed() {
            *sum_credits += course_status.course.credit;
            true
        } else {
            false
        }
    }

    fn iterate_course_list(&mut self) -> CreditInfo {
        // return sum_credits, count_courses, missing_points
        let mut sum_credits = self.credit_overflow;
        let mut count_courses = self.courses_overflow;
        let mut missing_credit = 0.0;
        let mut handled_courses = HashMap::new();
        for course_status in self.user.degree_status.course_statuses.iter_mut() {
            let mut course_chosen_for_bank = false;
            if course_status.valid_for_bank(&self.bank_name) {
                if self.course_list.contains(&course_status.course.id) {
                    course_chosen_for_bank = true;
                    handled_courses.insert(
                        course_status.course.id.clone(),
                        course_status.course.id.clone(),
                    );
                } else {
                    // check if course_status is a replacement for a course in course list
                    let mut course_id_in_list = None;
                    // First try to find catalog replacements
                    for course_id in &self.course_list {
                        if let Some(catalog_replacements) =
                            &self.catalog_replacements.get(course_id)
                        {
                            if catalog_replacements.contains(&course_status.course.id) {
                                course_id_in_list = Some(course_id);
                                if let Some(course) = self.courses.get(course_id) {
                                    course_status
                                        .set_msg(messages::catalog_replacements_msg(&course.name));
                                } else {
                                    // Shouldn't get here but to prevent crash in case of a bug we use the course id instead
                                    course_status
                                        .set_msg(messages::catalog_replacements_msg(course_id));
                                }
                                break;
                            }
                        }
                    }
                    if course_id_in_list.is_none() {
                        // Didn't find a catalog replacement so trying to find a common replacement
                        for course_id in &self.course_list {
                            if let Some(common_replacements) =
                                self.common_replacements.get(course_id)
                            {
                                if common_replacements.contains(&course_status.course.id) {
                                    course_id_in_list = Some(course_id);
                                    if let Some(course) = self.courses.get(course_id) {
                                        course_status.set_msg(messages::common_replacements_msg(
                                            &course.name,
                                        ));
                                    } else {
                                        // Shouldn't get here but to prevent crash in case of a bug we use the course id instead
                                        course_status
                                            .set_msg(messages::common_replacements_msg(course_id));
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if let Some(course_id) = course_id_in_list {
                        course_chosen_for_bank = true;
                        handled_courses.insert(course_id.clone(), course_status.course.id.clone());
                        if let Some(course) = self.courses.get(course_id) {
                            if course_status.course.credit < course.credit {
                                missing_credit += course.credit - course_status.course.credit;
                            }
                        }
                    }
                }
            }

            if course_chosen_for_bank
                && Self::set_type_and_add_credits(
                    course_status,
                    self.bank_name.clone(),
                    &mut sum_credits,
                )
            {
                count_courses += 1;
            }
        }

        CreditInfo {
            sum_credits,
            count_courses,
            missing_credit,
            handled_courses,
        }
    }

    pub fn all(mut self, missing_credit: &mut f32) -> f32 {
        let credit_info = self.iterate_course_list();

        // handle courses in course list which the user didn't complete or any replacement for them
        for course_id in &self.course_list {
            if !credit_info.handled_courses.contains_key(course_id) {
                let course = if let Some(course) = self.courses.get(course_id) {
                    course.clone()
                } else {
                    Course {
                        id: course_id.clone(),
                        credit: 0.0,
                        name: "שגיאה - קורס זה לא נמצא במאגר הקורסים של האתר".to_string(),
                    }
                };
                self.user.degree_status.course_statuses.push(CourseStatus {
                    course,
                    state: Some(CourseState::NotComplete),
                    r#type: Some(self.bank_name.clone()),
                    ..Default::default()
                });
            }
        }
        *missing_credit = credit_info.missing_credit;
        credit_info.sum_credits
    }

    pub fn accumulate_credit(mut self) -> f32 {
        let credit_info = self.iterate_course_list();
        credit_info.sum_credits
    }

    pub fn accumulate_courses(mut self, count_courses: &mut u32) -> f32 {
        let credit_info = self.iterate_course_list();
        *count_courses = credit_info.count_courses;
        credit_info.sum_credits
    }

    // TODO: remove this when removing the condition in the if statement
    #[allow(clippy::float_cmp)]
    pub fn malag(self, malag_courses: &[CourseId]) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && (malag_courses.contains(&course_status.course.id)
            // TODO: remove this line after we get the answer from the coordinates
            || (course_status.course.id.starts_with("324") && course_status.course.credit == 2.0)
            || course_status.r#type.is_some())
            // If type is not none it means valid_for_bank returns true because the user modified this course to be malag
            {
                Self::set_type_and_add_credits(
                    course_status,
                    self.bank_name.clone(),
                    &mut sum_credits,
                );
            }
        }
        sum_credits
    }

    pub fn sport(self) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && (course_status.is_sport() || course_status.r#type.is_some())
            // If type is not none it means valid_for_bank returns true because the user modified this course to be sport
            {
                Self::set_type_and_add_credits(
                    course_status,
                    self.bank_name.clone(),
                    &mut sum_credits,
                );
            }
        }
        sum_credits
    }

    pub fn free_choice(self) -> f32 {
        let mut sum_credits = self.credit_overflow;
        for course_status in &mut self.user.degree_status.course_statuses {
            if course_status.valid_for_bank(&self.bank_name)
                && !(course_status.semester == None && course_status.course.credit == 0.0)
            {
                Self::set_type_and_add_credits(
                    course_status,
                    self.bank_name.clone(),
                    &mut sum_credits,
                );
            }
        }
        sum_credits
    }

    pub fn chain(mut self, chains: &[Chain], chain_done: &mut Vec<String>) -> f32 {
        let credit_info = self.iterate_course_list();
        for chain in chains {
            //check if the user completed one of the chains.
            let mut completed_chain = true;
            for course_id in chain {
                if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                    if let Some(course_status) = self.user.get_course_status(course_id) {
                        if course_status.passed() {
                            chain_done.push(course_status.course.name.clone());
                        } else {
                            completed_chain = false;
                            break;
                        }
                    }
                } else {
                    completed_chain = false;
                    break;
                }
            }
            if completed_chain {
                return credit_info.sum_credits;
            } else {
                chain_done.clear();
            }
        }
        credit_info.sum_credits
    }

    pub fn specialization_group(
        mut self,
        specialization_groups: &SpecializationGroups,
        completed_groups: &mut Vec<String>,
    ) -> f32 {
        let credit_info = self.iterate_course_list();
        for specialization_group in &specialization_groups.groups_list {
            //check if the user completed all the specialization groups requirements
            let mut completed_group = true;
            if let Some(mandatory) = &specialization_group.mandatory {
                for courses in mandatory {
                    let mut completed_current_demand = false;
                    for course_id in courses {
                        // check if the user completed one of courses
                        if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                            if let Some(course_status) = self.user.get_course_status(course_id) {
                                if course_status.passed()
                                    && course_status.specialization_group_name.is_none()
                                {
                                    completed_current_demand = true;
                                    break;
                                }
                            }
                        }
                    }
                    completed_group &= completed_current_demand;
                    if !completed_group {
                        // The user didn't completed one of the mandatory courses
                        break;
                    }
                }
            }
            if !completed_group {
                continue;
            }
            let mut chosen_courses = Vec::new();
            for course_id in &specialization_group.course_list {
                if let Some(course_id) = credit_info.handled_courses.get(course_id) {
                    if let Some(course_status) = self.user.get_course_status(course_id) {
                        if course_status.passed()
                            && course_status.specialization_group_name.is_none()
                        {
                            chosen_courses.push(course_id.clone());
                        }
                        if (chosen_courses.len() as u8) == specialization_group.courses_sum {
                            // Until we implement exhaustive search on the specialization groups we should add this condition, so we cover more cases.
                            // when we find enough courses to finish this specialization group we don't need to check more courses, and then those courses can be taken to other groups.
                            break;
                        }
                    }
                }
            }
            completed_group &= (chosen_courses.len() as u8) == specialization_group.courses_sum;
            if completed_group {
                completed_groups.push(specialization_group.name.clone());
                for course_id in chosen_courses {
                    let course_status = self.user.get_mut_course_status(&course_id);
                    if let Some(course_status) = course_status {
                        course_status.set_specialization_group_name(&specialization_group.name);
                    }
                }
            }
        }

        credit_info.sum_credits
    }
}
