use std::collections::HashMap;
use std::sync::LazyLock;

use crate::core::bank_rule::BankRuleHandler;
use crate::core::degree_status::DegreeStatus;
use crate::core::tests::create_degree_status;
use crate::core::types::{
    DoubleGroup, Requirement, SpecializationGroup, SpecializationGroups, SpecializationGroupsType,
};
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
                mandatory: Some(vec![vec![CourseId::new("236334"), CourseId::new("236357")]]),
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
                mandatory: Some(vec![vec![CourseId::new("236343")]]),
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
                mandatory: Some(vec![
                    vec![CourseId::new("044231")],
                    vec![CourseId::new("046237")],
                ]),
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
                mandatory: Some(vec![vec![CourseId::new("044191")]]),
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
                mandatory: Some(vec![vec![CourseId::new("234129")]]),
                double: None,
            },
        ],
        groups_number: 3,
        groups_type: SpecializationGroupsType::Regular,
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
    // Under the Regular (satisfy-all) policy the shared mandatory course 044202 satisfies both
    // "תורת התקשורת" and "עיבוד אותות ותמונות", so both complete alongside "מערכות תוכנה ותכנות מתקדם".
    assert!(completed_groups.contains(&"עיבוד אותות ותמונות".to_string()));
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

fn sg_completed_course(id: &str) -> CourseStatus {
    CourseStatus {
        course: Course {
            id: CourseId::new(id),
            credit: 3.0,
            name: String::new(),
            tags: None,
        },
        state: Some(CourseState::Complete),
        grade: Some(Grade::Numeric(85)),
        ..Default::default()
    }
}

fn sg_ids(list: &[&str]) -> Vec<CourseId> {
    list.iter().copied().map(CourseId::new).collect()
}

fn sg_mandatory(list: Vec<Vec<&str>>) -> Option<Vec<Vec<CourseId>>> {
    Some(
        list.into_iter()
            .map(|sublist| sublist.into_iter().map(CourseId::new).collect())
            .collect(),
    )
}

fn run_specialization_group(completed: &[&str], sgs: &SpecializationGroups) -> (Vec<String>, usize) {
    let mut degree_status = DegreeStatus {
        course_statuses: completed.iter().map(|id| sg_completed_course(id)).collect(),
        course_bank_requirements: Vec::new(),
        overflow_msgs: Vec::new(),
        total_credit: 0.0,
    };
    let course_list = sg_ids(completed);
    let handler =
        create_bank_rule_handler!(&mut degree_status, "spec".to_string(), course_list, 0.0, 0);
    let mut groups_done = Vec::new();
    let (_, weight) = handler.specialization_group(sgs, &mut groups_done);
    (groups_done, weight)
}

#[test]
fn ee_2025_double_specialization_completes_from_catalog() {
    // Guards the shipped EE 2025-2026 catalog: a transcript with a double מיקרואלקטרוניקה group
    // (6 courses incl. both mandatory) plus the excellence group must reach weight 3.
    let text = std::fs::read_to_string("../docs/ElectricalEngineering2025-2026.json").unwrap();
    let mut v: serde_json::Value = serde_json::from_str(&text).unwrap();
    fn norm(v: &mut serde_json::Value) {
        match v {
            serde_json::Value::Object(m) => {
                if m.len() == 1 {
                    if let Some(serde_json::Value::String(s)) = m.get("$numberLong") {
                        if let Ok(n) = s.parse::<i64>() {
                            *v = serde_json::json!(n);
                            return;
                        }
                    }
                }
                for x in m.values_mut() {
                    norm(x);
                }
            }
            serde_json::Value::Array(a) => {
                for x in a {
                    norm(x);
                }
            }
            _ => {}
        }
    }
    norm(&mut v);
    let banks = v["course_banks"].as_array().unwrap();
    let sgs_value = banks
        .iter()
        .find_map(|b| b.get("rule").and_then(|r| r.get("SpecializationGroups")))
        .unwrap()
        .clone();
    let sgs: SpecializationGroups = serde_json::from_value(sgs_value).unwrap();

    let completed = [
        "01040012", "01040064", "01140032", "00440102", "01040013", "01040034", "01140071",
        "02340117", "03240033", "01040038", "01040214", "01140073", "00440105", "00440127",
        "01040136", "01040215", "01140075", "00440252", "00440124", "00440137", "00440158",
        "00450100", "03240305", "03940802", "00440157", "01040220", "00440131", "00440148",
        "00440268", "00450108", "00460225", "00460129", "03940803", "00440140", "00440202",
        "00440231", "00440239", "01040142", "00440101", "00440173", "00460012", "00440180",
        "00440175", "03250005", "00440176", "00460230", "01040158", "00460003",
    ];
    let (groups, weight) = run_specialization_group(&completed, &sgs);
    assert_eq!(weight, 3, "expected double micro (2) + excellence (1); got {groups:?}");
    assert!(groups.contains(&"מיקרואלקטרוניקה וננואלקטרוניקה (כפולה)".to_string()));
}

#[test]
fn test_specialization_group_double() {
    let sgs = SpecializationGroups {
        groups_list: vec![
            SpecializationGroup {
                name: "אנרגיה".to_string(),
                courses_sum: 3,
                course_list: sg_ids(&["a1", "a2", "a3", "a4", "a5", "a6", "a7"]),
                mandatory: sg_mandatory(vec![vec!["a1"]]),
                double: Some(DoubleGroup {
                    courses_sum: 6,
                    mandatory: sg_mandatory(vec![vec!["a1"], vec!["a2", "a3"], vec!["a2", "a3"]]),
                }),
            },
            SpecializationGroup {
                name: "מחשבים".to_string(),
                courses_sum: 3,
                course_list: sg_ids(&["b1", "b2", "b3"]),
                mandatory: None,
                double: None,
            },
        ],
        groups_number: 3,
        groups_type: SpecializationGroupsType::Double,
    };

    // Six courses in the double-able group make it count as two groups, so together with the single
    // group the total weight is three.
    let (groups, weight) =
        run_specialization_group(&["a1", "a2", "a3", "a4", "a5", "a6", "b1", "b2", "b3"], &sgs);
    assert_eq!(weight, 3);
    assert!(groups.contains(&"אנרגיה (כפולה)".to_string()));
    assert!(groups.contains(&"מחשבים".to_string()));

    // Only three courses in the double-able group -> it counts as a single group (weight two total).
    let (groups, weight) = run_specialization_group(&["a1", "a2", "a3", "b1", "b2", "b3"], &sgs);
    assert_eq!(weight, 2);
    assert!(groups.contains(&"אנרגיה".to_string()));
    assert!(groups.contains(&"מחשבים".to_string()));

    // Six courses but only one of {a2, a3} -> the double mandatory is unmet, so it stays single.
    let (groups, weight) =
        run_specialization_group(&["a1", "a2", "a4", "a5", "a6", "a7", "b1", "b2", "b3"], &sgs);
    assert_eq!(weight, 2);
    assert!(groups.contains(&"אנרגיה".to_string()));
    assert!(!groups.contains(&"אנרגיה (כפולה)".to_string()));
}

#[test]
fn test_specialization_group_shared_mandatory_policies() {
    let build = |groups_type| SpecializationGroups {
        groups_list: vec![
            SpecializationGroup {
                name: "a".to_string(),
                courses_sum: 2,
                course_list: sg_ids(&["m", "a1", "a2"]),
                mandatory: sg_mandatory(vec![vec!["m"]]),
                double: None,
            },
            SpecializationGroup {
                name: "b".to_string(),
                courses_sum: 2,
                course_list: sg_ids(&["m", "b1", "b2"]),
                mandatory: sg_mandatory(vec![vec!["m"]]),
                double: None,
            },
        ],
        groups_number: 2,
        groups_type,
    };

    // Regular: the shared mandatory course `m` satisfies the mandatory of both groups, so both
    // complete even though `m` is counted toward only one of them.
    let (_, weight) = run_specialization_group(
        &["m", "a1", "a2", "b1", "b2"],
        &build(SpecializationGroupsType::Regular),
    );
    assert_eq!(weight, 2);

    // MandatoryNotShared: `m` satisfies at most one group, so only one group completes.
    let (_, weight) = run_specialization_group(
        &["m", "a1", "a2", "b1", "b2"],
        &build(SpecializationGroupsType::MandatoryNotShared(sg_ids(&["m"]))),
    );
    assert_eq!(weight, 1);
}

#[test]
fn test_double_ignored_unless_groups_type_is_double() {
    let sgs = SpecializationGroups {
        groups_list: vec![SpecializationGroup {
            name: "a".to_string(),
            courses_sum: 3,
            course_list: sg_ids(&["a1", "a2", "a3", "a4", "a5", "a6"]),
            mandatory: sg_mandatory(vec![vec!["a1"]]),
            double: Some(DoubleGroup {
                courses_sum: 6,
                mandatory: sg_mandatory(vec![vec!["a1"]]),
            }),
        }],
        groups_number: 1,
        groups_type: SpecializationGroupsType::Regular,
    };

    // Six courses reach the double threshold, but Regular never counts a group as double.
    let (groups, weight) = run_specialization_group(&["a1", "a2", "a3", "a4", "a5", "a6"], &sgs);
    assert_eq!(weight, 1);
    assert!(groups.contains(&"a".to_string()));
}
