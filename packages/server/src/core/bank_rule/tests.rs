use std::collections::HashMap;
use std::sync::LazyLock;

use crate::core::bank_rule::BankRuleHandler;
use crate::core::degree_status::DegreeStatus;
use crate::core::tests::create_degree_status;
use crate::core::types::{Requirement, SpecializationGroup, SpecializationGroups};
use crate::create_bank_rule_handler;
use crate::resources::course::{Course, CourseId, CourseState, CourseStatus, Grade};

static COURSES: LazyLock<HashMap<CourseId, Course>> = LazyLock::new(|| {
    HashMap::from([
        (
            CourseId::new("104031"),
            Course {
                id: CourseId::new("104031"),
                credit: 5.5,
                name: "infi1m".to_string(),
                tags: None,
            },
        ),
        (
            CourseId::new("104166"),
            Course {
                id: CourseId::new("104166"),
                credit: 5.5,
                name: "Algebra alef".to_string(),
                tags: None,
            },
        ),
        (
            CourseId::new("114052"),
            Course {
                id: CourseId::new("114052"),
                credit: 3.5,
                name: "פיסיקה 2".to_string(),
                tags: None,
            },
        ),
        (
            CourseId::new("114054"),
            Course {
                id: CourseId::new("114054"),
                credit: 3.5,
                name: "פיסיקה 3".to_string(),
                tags: None,
            },
        ),
        (
            CourseId::new("236303"),
            Course {
                id: CourseId::new("236303"),
                credit: 3.0,
                name: "project1".to_string(),
                tags: None,
            },
        ),
        (
            CourseId::new("236512"),
            Course {
                id: CourseId::new("236512"),
                credit: 3.0,
                name: "project2".to_string(),
                tags: None,
            },
        ),
        (
            CourseId::new("11111111"),
            Course {
                id: CourseId::new("11111111"),
                credit: 1.0,
                name: "".to_string(),
                tags: None,
            },
        ),
        (
            CourseId::new("22222222"),
            Course {
                id: CourseId::new("22222222"),
                credit: 2.0,
                name: "".to_string(),
                tags: None,
            },
        ),
        (
            CourseId::new("33333333"),
            Course {
                id: CourseId::new("33333333"),
                credit: 3.0,
                name: "".to_string(),
                tags: None,
            },
        ),
    ])
});

#[tokio::test]
async fn test_rule_all() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "hova".to_string();
    let course_list = vec![
        CourseId::new("104031"),
        CourseId::new("104166"),
        CourseId::new("11111111"),
        CourseId::new("22222222"),
        CourseId::new("33333333"),
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
    assert_eq!(*degree_status.course_statuses[8].course.id, *"11111111");
    assert!(matches!(
        degree_status.course_statuses[8].state,
        Some(CourseState::NotComplete)
    ));

    assert_eq!(*degree_status.course_statuses[9].course.id, *"22222222");
    assert!(matches!(
        degree_status.course_statuses[9].state,
        Some(CourseState::NotComplete)
    ));

    assert_eq!(*degree_status.course_statuses[10].course.id, *"33333333");
    assert!(matches!(
        degree_status.course_statuses[10].state,
        Some(CourseState::NotComplete)
    ));

    // check sum credit
    assert_eq!(res, 5.5);
}
#[tokio::test]
async fn test_rule_accumulate_credit() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "reshima a".to_string();
    let course_list = vec![
        CourseId::new("236303"),
        CourseId::new("236512"),
        CourseId::new("11111111"),
        CourseId::new("22222222"),
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

#[tokio::test]
async fn test_rule_accumulate_courses() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "Project".to_string();
    let course_list = vec![
        CourseId::new("236303"),
        CourseId::new("236512"),
        CourseId::new("11111111"),
        CourseId::new("22222222"),
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

#[tokio::test]
async fn test_rule_chain() {
    let mut degree_status = create_degree_status();
    let bank_name = "science chain".to_string();
    let course_list = vec![
        CourseId::new("11111111"),
        CourseId::new("22222222"),
        CourseId::new("114052"),
        CourseId::new("5"),
        CourseId::new("114054"),
        CourseId::new("444444"),
    ];
    let mut chains = vec![
        vec![CourseId::new("11111111"), CourseId::new("22222222")],
        vec![CourseId::new("114052"), CourseId::new("5")],
        vec![CourseId::new("22222222"), CourseId::new("114054")],
        vec![CourseId::new("114052"), CourseId::new("444444")],
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
    chains.push(vec![CourseId::new("114052"), CourseId::new("114054")]); // user finished the chain [114052, 114054]
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

#[tokio::test]
async fn test_rule_malag() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "MALAG".to_string();
    let course_list = vec![CourseId::new("11111111"), CourseId::new("22222222")]; // this list shouldn't affect anything
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

#[tokio::test]
async fn test_rule_sport() {
    // for debugging
    let mut degree_status = create_degree_status();
    let bank_name = "SPORT".to_string();
    let course_list = vec![CourseId::new("11111111"), CourseId::new("22222222")]; // this list shouldn't affect anything
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
#[tokio::test]
async fn test_specialization_group() {
    // Simulate specialization groups behavior from catalog 2018 computer engineering
    let bank_name = "specialization group".to_string();
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            CourseStatus {
                course: Course {
                    id: CourseId::new("236334"),
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
                    id: CourseId::new("044202"),
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
                    id: CourseId::new("236374"),
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
                    id: CourseId::new("044198"),
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
                    id: CourseId::new("236501"),
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
                    id: CourseId::new("236329"),
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
                    id: CourseId::new("234325"),
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
                    id: CourseId::new("044191"),
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
                    id: CourseId::new("046206"),
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
                    id: CourseId::new("236319"),
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
                    id: CourseId::new("236321"),
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
                    id: CourseId::new("236322"),
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
        CourseId::new("236334"),
        CourseId::new("044202"),
        CourseId::new("046206"),
        CourseId::new("236374"),
        CourseId::new("044198"),
        CourseId::new("236501"),
        CourseId::new("236329"),
        CourseId::new("234325"),
        CourseId::new("044191"),
        CourseId::new("236319"),
        CourseId::new("236321"),
        CourseId::new("236322"),
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
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["236334".to_string(), "236357".to_string()]]),
                double: None,
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
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: Some(vec![
                    vec![CourseId::new("044202")],
                    vec![CourseId::new("046206"), CourseId::new("046204")],
                ]),
                double: None,
            },
            SpecializationGroup {
                name: "אלגוריתמים, צפינה, קריפטוגרפיה וסיבוכיות".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "046205", "234129", "236309", "236313", "236343", "236359", "236374", "236500",
                    "236506", "236525", "236520", "236522", "236719", "236760", "236990",
                ]
                .into_iter()
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["236343".to_string()]]),
                double: None,
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
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: Some(vec![
                    vec![CourseId::new("044198")],
                    vec![CourseId::new("044202"), CourseId::new("236860")],
                ]),
                double: None,
            },
            SpecializationGroup {
                name: "מערכות נבונות".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "234325", "236501", "236927", "234293", "236372", "236373", "236716", "236756",
                    "236760", "046194", "236329", "236861", "236873", "236941", "236860", "236862",
                ]
                .into_iter()
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec![
                    CourseId::new("234325"),
                    CourseId::new("236501"),
                    CourseId::new("236927"),
                ]]),
                double: None,
            },
            SpecializationGroup {
                name: "מעגלים אלקטרוניים משולבים".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "044231", "046235", "046237", "046903", "046265", "046129", "044140", "044148",
                    "046187", "046189", "046773", "046851", "046880",
                ]
                .into_iter()
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["044231".to_string()], vec!["046237".to_string()]]),
                double: None,
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
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: None,
                double: None,
            },
            SpecializationGroup {
                name: "בקרה ורובוטיקה".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "044191", "044192", "044193", "046194", "044198", "044202", "046189", "046196",
                    "236330", "236756", "236927",
                ]
                .into_iter()
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["044191".to_string()]]),
                double: None,
            },
            SpecializationGroup {
                name: "שפות תכנות, שפות פורמליות וטבעיות".to_string(),
                courses_sum: 3,
                course_list: vec![
                    "234129", "234293", "236319", "236299", "236342", "236345", "236360", "236368",
                    "236780",
                ]
                .into_iter()
                .map(CourseId::new)
                .collect::<Vec<_>>(),
                mandatory: Some(vec![vec!["234129".to_string()]]),
                double: None,
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
    let mut completed_groups = Vec::<(String, usize)>::new();
    handle_bank_rule_processor.specialization_group(&sgs, &mut completed_groups);

    assert_eq!(completed_groups.len(), 3);
    let names: Vec<&str> = completed_groups.iter().map(|(n, _)| n.as_str()).collect();
    assert!(names.contains(&"תורת התקשורת"));
    assert!(names.contains(&"מערכות נבונות"));
    assert!(names.contains(&"מערכות תוכנה ותכנות מתקדם"));
    assert!(completed_groups.iter().all(|(_, w)| *w == 1));

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
    let mut completed_groups = Vec::<(String, usize)>::new();
    handle_bank_rule_processor.specialization_group(&sgs, &mut completed_groups);
    assert_eq!(completed_groups.len(), 2);
    let names: Vec<&str> = completed_groups.iter().map(|(n, _)| n.as_str()).collect();
    assert!(names.contains(&"מערכות נבונות"));
    assert!(names.contains(&"מערכות תוכנה ותכנות מתקדם"));
}

// ---------------------------------------------------------------------------
// Double specialization group tests (EE-style)
// ---------------------------------------------------------------------------

/// Helper: create a completed CourseStatus
fn completed_course(id: &str, credit: f32) -> CourseStatus {
    CourseStatus {
        course: Course {
            id: id.to_string(),
            credit,
            name: String::new(),
            tags: None,
        },
        state: Some(CourseState::Complete),
        grade: Some(Grade::Numeric(80)),
        ..Default::default()
    }
}

/// Test 1: Student completes 6 courses in a double-capable group → counts as 2
/// Plus 3 in a regular group → total weight 2+1 = 3, meets groups_number=3
#[tokio::test]
async fn test_double_group_counts_as_two() {
    let bank_name = "spec_groups".to_string();

    // 8 courses: 6 in group A (double-capable), 3 in group B (regular), 1 shared
    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            // Group A courses (double-capable, need 3 for single, 6 for double)
            completed_course("A1", 3.0),
            completed_course("A2", 3.0),
            completed_course("A3", 3.0),
            completed_course("A4", 3.0),
            completed_course("A5", 3.0),
            completed_course("A6", 3.0), // 6th course → triggers double
            // Group B courses (regular, need 3)
            completed_course("B1", 3.0),
            completed_course("B2", 3.0),
            completed_course("B3", 3.0),
        ],
        ..Default::default()
    };

    let course_list = degree_status
        .course_statuses
        .iter()
        .map(|cs| cs.course.id.clone())
        .collect::<Vec<_>>();

    let sgs = SpecializationGroups {
        groups_list: vec![
            SpecializationGroup {
                name: "Group A (double-capable)".to_string(),
                courses_sum: 3,
                course_list: vec!["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]
                    .into_iter()
                    .map(|c| c.to_string())
                    .collect(),
                mandatory: Some(vec![vec!["A1".to_string()]]),
                double: Some(crate::core::types::DoubleGroupRequirement {
                    courses_sum: 6,
                    mandatory: Some(vec![vec!["A1".to_string()], vec!["A2".to_string()]]),
                }),
            },
            SpecializationGroup {
                name: "Group B (regular)".to_string(),
                courses_sum: 3,
                course_list: vec!["B1", "B2", "B3", "B4", "B5"]
                    .into_iter()
                    .map(|c| c.to_string())
                    .collect(),
                mandatory: None,
                double: None,
            },
        ],
        groups_number: 3, // Need weight >= 3
    };

    let handler = create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 0);
    let mut completed_groups = Vec::<(String, usize)>::new();
    handler.specialization_group(&sgs, &mut completed_groups);

    // Group A should be double (weight 2), Group B single (weight 1) → total 3
    assert_eq!(completed_groups.len(), 2);
    let total_weight: usize = completed_groups.iter().map(|(_, w)| w).sum();
    assert_eq!(total_weight, 3);

    let a = completed_groups
        .iter()
        .find(|(n, _)| n.contains("Group A"))
        .unwrap();
    assert_eq!(a.1, 2); // double

    let b = completed_groups
        .iter()
        .find(|(n, _)| n.contains("Group B"))
        .unwrap();
    assert_eq!(b.1, 1); // single
}

/// Test 2: Student has 5 courses in double group (not enough for 6) → falls back to single
/// Needs 2 more regular groups to reach weight 3
#[tokio::test]
async fn test_double_group_fallback_to_single_with_5_courses() {
    let bank_name = "spec_groups".to_string();

    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            // Group A: 5 courses (enough for single=3, NOT enough for double=6)
            completed_course("A1", 3.0),
            completed_course("A2", 3.0),
            completed_course("A3", 3.0),
            completed_course("A4", 3.0),
            completed_course("A5", 3.0),
            // Group B: 3 courses
            completed_course("B1", 3.0),
            completed_course("B2", 3.0),
            completed_course("B3", 3.0),
            // Group C: 3 courses
            completed_course("C1", 3.0),
            completed_course("C2", 3.0),
            completed_course("C3", 3.0),
        ],
        ..Default::default()
    };

    let course_list = degree_status
        .course_statuses
        .iter()
        .map(|cs| cs.course.id.clone())
        .collect::<Vec<_>>();

    let sgs = SpecializationGroups {
        groups_list: vec![
            SpecializationGroup {
                name: "Group A (double-capable)".to_string(),
                courses_sum: 3,
                course_list: vec!["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"]
                    .into_iter()
                    .map(|c| c.to_string())
                    .collect(),
                mandatory: None,
                double: Some(crate::core::types::DoubleGroupRequirement {
                    courses_sum: 6,
                    mandatory: None,
                }),
            },
            SpecializationGroup {
                name: "Group B".to_string(),
                courses_sum: 3,
                course_list: vec!["B1", "B2", "B3", "B4"]
                    .into_iter()
                    .map(|c| c.to_string())
                    .collect(),
                mandatory: None,
                double: None,
            },
            SpecializationGroup {
                name: "Group C".to_string(),
                courses_sum: 3,
                course_list: vec!["C1", "C2", "C3", "C4"]
                    .into_iter()
                    .map(|c| c.to_string())
                    .collect(),
                mandatory: None,
                double: None,
            },
        ],
        groups_number: 3,
    };

    let handler = create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 0);
    let mut completed_groups = Vec::<(String, usize)>::new();
    handler.specialization_group(&sgs, &mut completed_groups);

    // All 3 groups should be single (weight 1 each) → total 3
    assert_eq!(completed_groups.len(), 3);
    let total_weight: usize = completed_groups.iter().map(|(_, w)| w).sum();
    assert_eq!(total_weight, 3);
    assert!(completed_groups.iter().all(|(_, w)| *w == 1));
}

/// Test 3: Double group mandatory not met → falls back to single even with 6 courses
#[tokio::test]
async fn test_double_group_mandatory_not_met() {
    let bank_name = "spec_groups".to_string();

    let mut degree_status = DegreeStatus {
        course_statuses: vec![
            // Group A: 6 courses, but missing mandatory "A_REQ" for double
            completed_course("A1", 3.0),
            completed_course("A2", 3.0),
            completed_course("A3", 3.0),
            completed_course("A4", 3.0),
            completed_course("A5", 3.0),
            completed_course("A6", 3.0),
            // Group B: 3 courses
            completed_course("B1", 3.0),
            completed_course("B2", 3.0),
            completed_course("B3", 3.0),
        ],
        ..Default::default()
    };

    let course_list = degree_status
        .course_statuses
        .iter()
        .map(|cs| cs.course.id.clone())
        .collect::<Vec<_>>();

    let sgs = SpecializationGroups {
        groups_list: vec![
            SpecializationGroup {
                name: "Group A (double-capable)".to_string(),
                courses_sum: 3,
                course_list: vec!["A1", "A2", "A3", "A4", "A5", "A6"]
                    .into_iter()
                    .map(|c| c.to_string())
                    .collect(),
                mandatory: Some(vec![vec!["A1".to_string()]]), // single mandatory: A1 ✓
                double: Some(crate::core::types::DoubleGroupRequirement {
                    courses_sum: 6,
                    // double mandatory requires A_REQ which student doesn't have
                    mandatory: Some(vec![vec!["A_REQ".to_string()]]),
                }),
            },
            SpecializationGroup {
                name: "Group B".to_string(),
                courses_sum: 3,
                course_list: vec!["B1", "B2", "B3", "B4"]
                    .into_iter()
                    .map(|c| c.to_string())
                    .collect(),
                mandatory: None,
                double: None,
            },
        ],
        groups_number: 3, // Need weight >= 3
    };

    let handler = create_bank_rule_handler!(&mut degree_status, bank_name, course_list, 0.0, 0);
    let mut completed_groups = Vec::<(String, usize)>::new();
    handler.specialization_group(&sgs, &mut completed_groups);

    // Group A: has 6 courses but double mandatory not met → single (weight 1)
    // Group B: single (weight 1)
    // Total: 2, need 3 → NOT complete
    let total_weight: usize = completed_groups.iter().map(|(_, w)| w).sum();
    assert_eq!(total_weight, 2);
    assert_eq!(completed_groups.len(), 2);

    let a = completed_groups
        .iter()
        .find(|(n, _)| n.contains("Group A"))
        .unwrap();
    assert_eq!(a.1, 1); // fell back to single despite having 6 courses
}
