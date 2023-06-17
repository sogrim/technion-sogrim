use std::collections::HashMap;

use actix_rt::test;

use crate::core::bank_rule::BankRuleHandler;
use crate::core::degree_status::DegreeStatus;
use crate::core::tests::create_degree_status;
use crate::core::types::{Requirement, Rule};
use crate::create_bank_rule_handler;
use crate::db::{Db, FilterOption};
use crate::resources::catalog::Catalog;
use crate::resources::course::{Course, CourseState, CourseStatus, Grade};

#[test]
async fn test_rule_all() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "hova".to_string();
    let course_list = vec![
        "104031".to_string(),
        "104166".to_string(),
        "1".to_string(),
        "2".to_string(),
        "3".to_string(),
    ];
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 0);
    let mut missing_credit_dummy = 0.0;
    let mut completed_dummy = true;
    let res = handle_bank_rule_processor.all(&mut missing_credit_dummy, &mut completed_dummy);
    // check it adds the type
    assert_eq!(
        degree_status.course_statuses[0].r#type,
        Some("hova".to_string())
    );
    assert_eq!(
        degree_status.course_statuses[1].r#type,
        Some("hova".to_string())
    );

    // check it adds the not completed courses in the hove bank
    assert_eq!(degree_status.course_statuses[8].course.id, "1".to_string());
    assert!(matches!(
        degree_status.course_statuses[8].state,
        Some(CourseState::NotComplete)
    ));

    assert_eq!(degree_status.course_statuses[9].course.id, "2".to_string());
    assert!(matches!(
        degree_status.course_statuses[9].state,
        Some(CourseState::NotComplete)
    ));

    assert_eq!(degree_status.course_statuses[10].course.id, "3".to_string());
    assert!(matches!(
        degree_status.course_statuses[10].state,
        Some(CourseState::NotComplete)
    ));

    // check sum credit
    assert_eq!(res, 5.5);
}
#[test]
async fn test_rule_accumulate_credit() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "reshima a".to_string();
    let course_list = vec![
        "236303".to_string(),
        "236512".to_string(),
        "1".to_string(),
        "2".to_string(),
    ];
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 5.5, 0);
    let res = handle_bank_rule_processor.accumulate_credit();
    // check it adds the type
    assert_eq!(degree_status.course_statuses[0].r#type, None);
    assert_eq!(degree_status.course_statuses[1].r#type, None);
    assert_eq!(degree_status.course_statuses[2].r#type, None);
    assert_eq!(degree_status.course_statuses[3].r#type, None);
    assert_eq!(
        degree_status.course_statuses[4].r#type,
        Some("reshima a".to_string())
    );
    assert_eq!(
        degree_status.course_statuses[5].r#type,
        Some("reshima a".to_string())
    );
    assert_eq!(degree_status.course_statuses[6].r#type, None);
    assert_eq!(degree_status.course_statuses[7].r#type, None);
    assert_eq!(degree_status.course_statuses.len(), 8);

    // check sum credit
    assert_eq!(res, 11.5);
}

#[test]
async fn test_rule_accumulate_courses() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "Project".to_string();
    let course_list = vec![
        "236303".to_string(),
        "236512".to_string(),
        "1".to_string(),
        "2".to_string(),
    ];
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 1);
    let mut count_courses = 0;
    let res = handle_bank_rule_processor.accumulate_courses(&mut count_courses);
    // check it adds the type
    assert_eq!(degree_status.course_statuses[0].r#type, None);
    assert_eq!(degree_status.course_statuses[1].r#type, None);
    assert_eq!(degree_status.course_statuses[2].r#type, None);
    assert_eq!(degree_status.course_statuses[3].r#type, None);
    assert_eq!(
        degree_status.course_statuses[4].r#type,
        Some("Project".to_string())
    );
    assert_eq!(
        degree_status.course_statuses[5].r#type,
        Some("Project".to_string())
    );
    assert_eq!(degree_status.course_statuses[6].r#type, None);
    assert_eq!(degree_status.course_statuses[7].r#type, None);
    assert_eq!(degree_status.course_statuses.len(), 8);

    //check num courses
    assert_eq!(count_courses, 3);

    // check sum credit
    assert_eq!(res, 6.0);
}

#[test]
async fn test_rule_chain() {
    let mut degree_status = create_degree_status();
    let bank_name = "science chain".to_string();
    let course_list = vec![
        "1".to_string(),
        "2".to_string(),
        "114052".to_string(),
        "5".to_string(),
        "114054".to_string(),
        "111111".to_string(),
    ];
    let mut chains = vec![
        vec!["1".to_string(), "2".to_string()],
        vec!["114052".to_string(), "5".to_string()],
        vec!["222222".to_string(), "114054".to_string()],
        vec!["114052".to_string(), "111111".to_string()],
    ];

    let mut chain_done = Vec::new();
    let handle_bank_rule_processor = create_bank_rule_handler!(
        &mut degree_status,
        bank_name.clone(),
        course_list.clone(),
        0.0,
        0
    );
    // user didn't finish a chain
    let res = handle_bank_rule_processor.chain(&chains, &mut chain_done);

    assert!(chain_done.is_empty());
    assert_eq!(res, 7.0);

    // ---------------------------------------------------------------------------
    degree_status = create_degree_status();
    chains.push(vec!["114052".to_string(), "114054".to_string()]); // user finished the chain [114052, 114054]
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 0);
    let res = handle_bank_rule_processor.chain(&chains, &mut chain_done);
    assert_eq!(degree_status.course_statuses[0].r#type, None);
    assert_eq!(degree_status.course_statuses[1].r#type, None);
    assert_eq!(
        degree_status.course_statuses[2].r#type,
        Some("science chain".to_string())
    );
    assert_eq!(
        degree_status.course_statuses[3].r#type,
        Some("science chain".to_string())
    );
    assert_eq!(degree_status.course_statuses[4].r#type, None);
    assert_eq!(degree_status.course_statuses[5].r#type, None);
    assert_eq!(degree_status.course_statuses[6].r#type, None);
    assert_eq!(degree_status.course_statuses[7].r#type, None);
    assert_eq!(degree_status.course_statuses.len(), 8);

    // check sum credit
    assert_eq!(
        chain_done,
        vec!["פיסיקה 2".to_string(), "פיסיקה 3".to_string()]
    );
    assert_eq!(res, 7.0);
}

#[test]
async fn test_rule_malag() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "MALAG".to_string();
    let course_list = vec!["1".to_string(), "2".to_string()]; // this list shouldn't affect anything
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 0);
    let res = handle_bank_rule_processor.malag();

    // check it adds the type
    assert_eq!(degree_status.course_statuses[0].r#type, None);
    assert_eq!(degree_status.course_statuses[1].r#type, None);
    assert_eq!(degree_status.course_statuses[2].r#type, None);
    assert_eq!(degree_status.course_statuses[3].r#type, None);
    assert_eq!(degree_status.course_statuses[4].r#type, None);
    assert_eq!(degree_status.course_statuses[5].r#type, None);
    assert_eq!(
        degree_status.course_statuses[6].r#type,
        Some("MALAG".to_string())
    );
    assert_eq!(degree_status.course_statuses[7].r#type, None);
    assert_eq!(degree_status.course_statuses.len(), 8);

    // check sum credit
    assert_eq!(res, 2.0);
}

#[test]
async fn test_rule_sport() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "SPORT".to_string();
    let course_list = vec!["1".to_string(), "2".to_string()]; // this list shouldn't affect anything
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 0);
    let res = handle_bank_rule_processor.sport();

    // check it adds the type
    assert_eq!(degree_status.course_statuses[0].r#type, None);
    assert_eq!(degree_status.course_statuses[1].r#type, None);
    assert_eq!(degree_status.course_statuses[2].r#type, None);
    assert_eq!(degree_status.course_statuses[3].r#type, None);
    assert_eq!(degree_status.course_statuses[4].r#type, None);
    assert_eq!(degree_status.course_statuses[5].r#type, None);
    assert_eq!(degree_status.course_statuses[6].r#type, None);
    assert_eq!(
        degree_status.course_statuses[7].r#type,
        Some("SPORT".to_string())
    );
    assert_eq!(degree_status.course_statuses.len(), 8);

    // check sum credit
    assert_eq!(res, 1.0);
}
#[test]
async fn test_specialization_group() {
    // Simulate specialization groups behavior from catalog 2018 computer engineering
    let bank_name = "קבוצות התמחות".to_string();
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            CourseStatus {
                course: Course {
                    id: "236334".to_string(),
                    credit: 5.5,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(85)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "044202".to_string(),
                    credit: 5.5,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Binary(true)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "236374".to_string(),
                    credit: 3.5,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(85)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "044198".to_string(),
                    credit: 3.0,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(85)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "236501".to_string(),
                    credit: 3.0,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(85)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "236329".to_string(),
                    credit: 2.0,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(99)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "234325".to_string(),
                    credit: 1.0,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(100)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "044191".to_string(),
                    credit: 1.0,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(100)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "046206".to_string(),
                    credit: 3.5,
                    name: "".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(85)),
                ..Default::default()
            },
        ],
        course_bank_requirements: Vec::<Requirement>::new(),
        overflow_msgs: Vec::<String>::new(),
        total_credit: 0.0,
    };
    let course_list = vec![
        "236334".to_string(),
        "044202".to_string(),
        "046206".to_string(),
        "236374".to_string(),
        "044198".to_string(),
        "236501".to_string(),
        "236329".to_string(),
        "234325".to_string(),
        "044191".to_string(),
    ];
    let db = Db::new().await;
    let catalog = &db
        .get_filtered::<Catalog>(FilterOption::Regex, "name", "הנדסת מחשבים")
        .await
        .unwrap()[0];

    let rule = &catalog
        .course_banks
        .iter()
        .find(|bank| bank.name == bank_name)
        .unwrap()
        .rule;
    let Rule::SpecializationGroups(sgs) = rule else {
        panic!("Expected specialization groups rule")
    };

    let handle_bank_rule_processor = create_bank_rule_handler!(
        &mut degree_status,
        bank_name.clone(),
        course_list.clone(),
        0.0,
        0
    );
    let mut completed_groups = Vec::<String>::new();
    handle_bank_rule_processor.specialization_group(sgs, &mut completed_groups);

    assert_eq!(completed_groups.len(), 2);
    assert!(completed_groups.contains(&"תורת התקשורת".to_string()));
    assert!(completed_groups.contains(&"מערכות נבונות".to_string()));

    // ---------------------------------------------------------------------------
    // change the state of 044202, which is a mandatory course in "תורת התקשורת", to notComplete,
    // thus the user doesn't complete the specialization groups requirement
    degree_status.course_statuses[1].state = Some(CourseState::NotComplete);
    degree_status.course_statuses[1].grade = Some(Grade::Numeric(50));

    for course_status in &mut degree_status.course_statuses {
        course_status.specialization_group_name = None;
        course_status.r#type = None;
    }
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 0);
    let mut completed_groups = Vec::<String>::new();
    handle_bank_rule_processor.specialization_group(sgs, &mut completed_groups);
    assert_eq!(completed_groups.len(), 1);
    assert!(completed_groups.contains(&"מערכות נבונות".to_string()));
}

#[test]
async fn test_sg_replacement_edge_case() {
    let bank_name = "קבוצות התמחות".to_string();
    let db = Db::new().await;
    let catalog = &db
        .get_filtered::<Catalog>(FilterOption::Regex, "name", "הנדסת מחשבים")
        .await
        .unwrap()[0];

    let rule = &catalog
        .course_banks
        .iter()
        .find(|bank| bank.name == bank_name)
        .unwrap()
        .rule;
    let Rule::SpecializationGroups(sgs) = rule else {
        panic!("Expected specialization groups rule")
    };
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            CourseStatus {
                course: Course {
                    id: "044334".to_string(),
                    credit: 3.0,
                    name: "רשתות מחשבים ואינטרנט 1".to_string(),
                    tags: None,
                },
                // this is a simulated run after a first degree-status call, where 044334 is already tagged as "מקצועות ליבה"
                r#type: Some("מקצועות ליבה".to_string()),
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(85)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "236351".to_string(),
                    credit: 3.0,
                    name: "מערכות מבוזרות".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(85)),
                ..Default::default()
            },
            CourseStatus {
                course: Course {
                    id: "236376".to_string(),
                    credit: 4.0,
                    name: "הנדסת מערכות הפעלה".to_string(),
                    tags: None,
                },
                state: Some(CourseState::Complete),
                grade: Some(Grade::Numeric(85)),
                ..Default::default()
            },
        ],
        course_bank_requirements: Vec::new(),
        overflow_msgs: Vec::new(),
        total_credit: 0.0,
    };
    let mut handle_bank_rule_processor = create_bank_rule_handler!(
        &mut degree_status,
        bank_name.clone(),
        catalog.get_course_list("קבוצות התמחות"),
        0.0,
        0
    );
    handle_bank_rule_processor.common_replacements = &catalog.common_replacements;
    handle_bank_rule_processor.catalog_replacements = &catalog.catalog_replacements;
    let mut completed_groups = Vec::new();
    handle_bank_rule_processor.specialization_group(sgs, &mut completed_groups);

    // 044334 is a replacement for 236334, and 236334 is "מקצועות ליבה", this makes 044334 "מקצועות ליבה" as well.
    assert_eq!(completed_groups.len(), 0);
    assert_eq!(
        degree_status.course_statuses[0].specialization_group_name,
        None
    );

    // now the user manually modifies the type of 044334 to be "קבוצות התמחות", and the user completes the requirement
    degree_status.course_statuses[0].r#type = Some("קבוצות התמחות".to_string());
    degree_status.course_statuses[0].modified = true;

    // reset types to let the rule handler do its job
    degree_status.course_statuses[1].r#type = None;
    degree_status.course_statuses[2].r#type = None;

    let mut handle_bank_rule_processor = create_bank_rule_handler!(
        &mut degree_status,
        bank_name.clone(),
        catalog.get_course_list("קבוצות התמחות"),
        0.0,
        0
    );
    handle_bank_rule_processor.common_replacements = &catalog.common_replacements;
    handle_bank_rule_processor.catalog_replacements = &catalog.catalog_replacements;
    let mut completed_groups = Vec::new();
    handle_bank_rule_processor.specialization_group(sgs, &mut completed_groups);
    assert_eq!(completed_groups.len(), 1);
    assert_eq!(
        degree_status.course_statuses[0].specialization_group_name,
        Some("רשתות מחשבים, מערכות מבוזרות ומבנה מחשבים".to_string())
    );
}
