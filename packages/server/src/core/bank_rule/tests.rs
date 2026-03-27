use std::collections::HashMap;

use actix_rt::test;
use lazy_static::lazy_static;

use crate::core::bank_rule::BankRuleHandler;
use crate::core::degree_status::DegreeStatus;
use crate::core::tests::create_degree_status;
use crate::core::types::{Requirement, SpecializationGroup, SpecializationGroups};
use crate::create_bank_rule_handler;
use crate::resources::course::{Course, CourseState, CourseStatus, Grade};

lazy_static! {
    static ref COURSES: HashMap<String, Course> = HashMap::from([
        (
            "104031".to_string(),
            Course {
                id: "104031".to_string(),
                credit: 5.5,
                name: "infi1m".to_string(),
                tags: None
            },
        ),
        (
            "104166".to_string(),
            Course {
                id: "104166".to_string(),
                credit: 5.5,
                name: "Algebra alef".to_string(),
                tags: None
            },
        ),
        (
            "114052".to_string(),
            Course {
                id: "114052".to_string(),
                credit: 3.5,
                name: "פיסיקה 2".to_string(),
                tags: None
            },
        ),
        (
            "114054".to_string(),
            Course {
                id: "114054".to_string(),
                credit: 3.5,
                name: "פיסיקה 3".to_string(),
                tags: None
            },
        ),
        (
            "236303".to_string(),
            Course {
                id: "236303".to_string(),
                credit: 3.0,
                name: "project1".to_string(),
                tags: None
            },
        ),
        (
            "236512".to_string(),
            Course {
                id: "236512".to_string(),
                credit: 3.0,
                name: "project2".to_string(),
                tags: None
            },
        ),
        (
            "1".to_string(),
            Course {
                id: "1".to_string(),
                credit: 1.0,
                name: "".to_string(),
                tags: None
            },
        ),
        (
            "2".to_string(),
            Course {
                id: "2".to_string(),
                credit: 2.0,
                name: "".to_string(),
                tags: None
            },
        ),
        (
            "3".to_string(),
            Course {
                id: "3".to_string(),
                credit: 3.0,
                name: "".to_string(),
                tags: None
            },
        ),
    ]);
}

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
    let bank_name = "specialization group".to_string();
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
            CourseStatus {
                course: Course {
                    id: "236319".to_string(),
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
                    id: "236321".to_string(),
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
                    id: "236322".to_string(),
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
        "236319".to_string(),
        "236321".to_string(),
        "236322".to_string(),
    ];
    let sgs = SpecializationGroups {
        groups_list: vec![
            SpecializationGroup {
                name: "רשתות מחשבים, מערכות מבוזרות ומבנה מחשבים".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "236334", "236341", "236357", "046237", "236351", "046272", "046273", "236370",
                    "236376", "236350", "046853", "046925", "046993", "236268", "046275", "236278",
                    "046336", "046265",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["236334".to_string(), "236357".to_string()]]),
            },
            SpecializationGroup {
                name: "תורת התקשורת".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "236334", "236341", "044202", "046204", "046206", "046208", "044148", "044198",
                    "046201", "046205", "046868", "046743", "046733", "046993", "236309", "236525",
                    "236520",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: Some(vec![
                    vec!["044202".to_string()],
                    vec!["046206".to_string(), "046204".to_string()],
                ]),
            },
            SpecializationGroup {
                name: "אלגוריתמים, צפינה, קריפטוגרפיה וסיבוכיות".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "046205", "234129", "236309", "236313", "236343", "236359", "236374", "236500",
                    "236506", "236525", "236520", "236522", "236719", "236760", "236990",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["236343".to_string()]]),
            },
            SpecializationGroup {
                name: "עיבוד אותות ותמונות".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "044198", "044202", "236860", "234325", "236330", "046201", "046332", "046745",
                    "236873", "236373", "236861", "046733", "046831", "236756", "234125", "236329",
                    "236862",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: Some(vec![
                    vec!["044198".to_string()],
                    vec!["044202".to_string(), "236860".to_string()],
                ]),
            },
            SpecializationGroup {
                name: "מערכות נבונות".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "234325", "236501", "236927", "234293", "236372", "236373", "236716", "236756",
                    "236760", "046194", "236329", "236861", "236873", "236941", "236860", "236862",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec![
                    "234325".to_string(),
                    "236501".to_string(),
                    "236927".to_string(),
                ]]),
            },
            SpecializationGroup {
                name: "מעגלים אלקטרוניים משולבים".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "044231", "046235", "046237", "046903", "046265", "046129", "044140", "044148",
                    "046187", "046189", "046773", "046851", "046880",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["044231".to_string()], vec!["046237".to_string()]]),
            },
            SpecializationGroup {
                name: "מערכות תוכנה ותכנות מתקדם".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "236319", "236322", "236321", "236350", "236360", "236363", "236370", "236376",
                    "236703", "236351", "236501", "236700", "236780", "236790", "046272", "046273",
                    "046275", "236278",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: None,
            },
            SpecializationGroup {
                name: "בקרה ורובוטיקה".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "044191", "044192", "044193", "046194", "044198", "044202", "046189", "046196",
                    "236330", "236756", "236927",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["044191".to_string()]]),
            },
            SpecializationGroup {
                name: "שפות תכנות, שפות פורמליות וטבעיות".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "234129", "234293", "236319", "236299", "236342", "236345", "236360", "236368",
                    "236780",
                ]
                .into_iter()
                .map(|c| c.to_string())
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["234129".to_string()]]),
            },
        ],
        groups_number: 3,
    };

    let handle_bank_rule_processor = create_bank_rule_handler!(
        &mut degree_status,
        bank_name.clone(),
        course_list.clone(),
        0.0,
        0
    );
    let mut completed_groups = Vec::<String>::new();
    handle_bank_rule_processor.specialization_group(&sgs, &mut completed_groups);

    assert_eq!(completed_groups.len(), 3);
    assert!(completed_groups.contains(&"תורת התקשורת".to_string()));
    assert!(completed_groups.contains(&"מערכות נבונות".to_string()));
    assert!(completed_groups.contains(&"מערכות תוכנה ותכנות מתקדם".to_string()));

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
    handle_bank_rule_processor.specialization_group(&sgs, &mut completed_groups);
    assert_eq!(completed_groups.len(), 2);
    assert!(completed_groups.contains(&"מערכות נבונות".to_string()));
    assert!(completed_groups.contains(&"מערכות תוכנה ותכנות מתקדם".to_string()));
}
