use crate::config::CONFIG;
use crate::core::parser;
use crate::db;
use crate::resources::course::{self, Course, CourseState, CourseStatus, Grade};
use crate::resources::user::UserDetails;
use actix_rt::test;
use dotenv::dotenv;
use lazy_static::lazy_static;
use std::collections::HashMap;
use std::str::FromStr;

use super::*;

#[test]
async fn test_pdf_parser() {
    let from_pdf = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v.txt")
        .expect("Something went wrong reading the file");
    let courses_display_from_pdf =
        parser::parse_copy_paste_data(&from_pdf).expect("failed to parse pdf data");

    assert_eq!(courses_display_from_pdf.len(), 41);

    let mut from_pdf_bad_prefix = from_pdf.clone();
    from_pdf_bad_prefix.replace_range(0..0, "א");

    assert!(parser::parse_copy_paste_data(&from_pdf_bad_prefix).is_err());

    let from_pdf_bad_content = from_pdf.replace("סוף גיליון ציונים", "");

    assert!(parser::parse_copy_paste_data(&from_pdf_bad_content).is_err());
}

#[test]
async fn test_asterisk_course_edge_case() {
    let from_pdf = std::fs::read_to_string("../docs/pdf_ctrl_c_ctrl_v_3.txt")
        .expect("Something went wrong reading the file");
    let courses_display_from_pdf =
        parser::parse_copy_paste_data(&from_pdf).expect("failed to parse pdf data");

    let edge_case_course = courses_display_from_pdf
        .iter()
        .find(|c| c.course.id == "234129")
        .unwrap();

    assert_eq!(
        edge_case_course.grade.as_ref().unwrap(),
        &Grade::Numeric(67)
    );
    assert_eq!(edge_case_course.semester.as_ref().unwrap(), "חורף_1");
}

lazy_static! {
    static ref COURSES: HashMap<String, Course> = HashMap::from([
        (
            "104031".to_string(),
            Course {
                id: "104031".to_string(),
                credit: 5.5,
                name: "infi1m".to_string(),
            },
        ),
        (
            "104166".to_string(),
            Course {
                id: "104166".to_string(),
                credit: 5.5,
                name: "Algebra alef".to_string(),
            },
        ),
        (
            "114052".to_string(),
            Course {
                id: "114052".to_string(),
                credit: 3.5,
                name: "פיסיקה 2".to_string(),
            },
        ),
        (
            "114054".to_string(),
            Course {
                id: "114054".to_string(),
                credit: 3.5,
                name: "פיסיקה 3".to_string(),
            },
        ),
        (
            "236303".to_string(),
            Course {
                id: "236303".to_string(),
                credit: 3.0,
                name: "project1".to_string(),
            },
        ),
        (
            "236512".to_string(),
            Course {
                id: "236512".to_string(),
                credit: 3.0,
                name: "project2".to_string(),
            },
        ),
        (
            "1".to_string(),
            Course {
                id: "1".to_string(),
                credit: 1.0,
                name: "".to_string(),
            },
        ),
        (
            "2".to_string(),
            Course {
                id: "2".to_string(),
                credit: 2.0,
                name: "".to_string(),
            },
        ),
        (
            "3".to_string(),
            Course {
                id: "3".to_string(),
                credit: 3.0,
                name: "".to_string(),
            },
        ),
    ]);
}

#[macro_export]
macro_rules! create_bank_rule_handler {
    ($user:expr, $bank_name:expr, $course_list:expr, $credit_overflow:expr, $courses_overflow:expr) => {
        BankRuleHandler {
            user: $user,
            bank_name: $bank_name,
            course_list: $course_list,
            courses: &COURSES,
            credit_overflow: $credit_overflow,
            courses_overflow: $courses_overflow,
            catalog_replacements: &HashMap::new(),
            common_replacements: &HashMap::new(),
        }
    };
}

fn create_user() -> UserDetails {
    UserDetails {
        catalog: None,
        degree_status: DegreeStatus {
            course_statuses: vec![
                CourseStatus {
                    course: Course {
                        id: "104031".to_string(),
                        credit: 5.5,
                        name: "infi1m".to_string(),
                    },
                    state: Some(CourseState::Complete),
                    grade: Some(Grade::Numeric(85)),
                    ..Default::default()
                },
                CourseStatus {
                    course: Course {
                        id: "104166".to_string(),
                        credit: 5.5,
                        name: "Algebra alef".to_string(),
                    },
                    state: Some(CourseState::NotComplete),
                    grade: Some(Grade::Binary(false)),
                    ..Default::default()
                },
                CourseStatus {
                    course: Course {
                        id: "114052".to_string(),
                        credit: 3.5,
                        name: "פיסיקה 2".to_string(),
                    },
                    state: Some(CourseState::Complete),
                    grade: Some(Grade::Numeric(85)),
                    ..Default::default()
                },
                CourseStatus {
                    course: Course {
                        id: "114054".to_string(),
                        credit: 3.5,
                        name: "פיסיקה 3".to_string(),
                    },
                    state: Some(CourseState::Complete),
                    grade: Some(Grade::Numeric(85)),
                    ..Default::default()
                },
                CourseStatus {
                    course: Course {
                        id: "236303".to_string(),
                        credit: 3.0,
                        name: "project1".to_string(),
                    },
                    state: Some(CourseState::Complete),
                    grade: Some(Grade::Numeric(85)),
                    ..Default::default()
                },
                CourseStatus {
                    course: Course {
                        id: "236512".to_string(),
                        credit: 3.0,
                        name: "project2".to_string(),
                    },
                    state: Some(CourseState::Complete),
                    grade: Some(Grade::Numeric(85)),
                    ..Default::default()
                },
                CourseStatus {
                    course: Course {
                        id: "324057".to_string(), // Malag
                        credit: 2.0,
                        name: "mlg".to_string(),
                    },
                    state: Some(CourseState::Complete),
                    grade: Some(Grade::Numeric(99)),
                    ..Default::default()
                },
                CourseStatus {
                    course: Course {
                        id: "394645".to_string(), // Sport
                        credit: 1.0,
                        name: "sport".to_string(),
                    },
                    state: Some(CourseState::Complete),
                    grade: Some(Grade::Numeric(100)),
                    ..Default::default()
                },
            ],
            course_bank_requirements: Vec::<Requirement>::new(),
            overflow_msgs: Vec::<String>::new(),
            total_credit: 0.0,
        },
        modified: false,
    }
}

#[test]
async fn test_rule_all() {
    // for debugging
    let mut user = create_user();
    let bank_name = "hova".to_string();
    let course_list = vec![
        "104031".to_string(),
        "104166".to_string(),
        "1".to_string(),
        "2".to_string(),
        "3".to_string(),
    ];
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
    let mut missing_credit_dummy = 0.0;
    let res = handle_bank_rule_processor.all(&mut missing_credit_dummy);
    // check it adds the type
    assert_eq!(
        user.degree_status.course_statuses[0].r#type,
        Some("hova".to_string())
    );
    assert_eq!(
        user.degree_status.course_statuses[1].r#type,
        Some("hova".to_string())
    );

    // check it adds the not completed courses in the hove bank
    assert_eq!(
        user.degree_status.course_statuses[8].course.id,
        "1".to_string()
    );
    assert!(matches!(
        user.degree_status.course_statuses[8].state,
        Some(CourseState::NotComplete)
    ));

    assert_eq!(
        user.degree_status.course_statuses[9].course.id,
        "2".to_string()
    );
    assert!(matches!(
        user.degree_status.course_statuses[9].state,
        Some(CourseState::NotComplete)
    ));

    assert_eq!(
        user.degree_status.course_statuses[10].course.id,
        "3".to_string()
    );
    assert!(matches!(
        user.degree_status.course_statuses[10].state,
        Some(CourseState::NotComplete)
    ));

    // check sum credits
    assert_eq!(res, 5.5);
}

#[test]
async fn test_irrelevant_course() {
    // for debugging
    let mut user = create_user();
    user.degree_status.course_statuses[2].state = Some(CourseState::Irrelevant); // change 114052 to be irrelevant
    let bank_name = "hova".to_string();
    let course_list = vec!["104031".to_string(), "114052".to_string()];
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
    let mut missing_credit_dummy = 0.0;
    handle_bank_rule_processor.all(&mut missing_credit_dummy);

    assert_eq!(user.degree_status.course_statuses[2].r#type, None);
}

#[test]
async fn test_rule_accumulate_credit() {
    // for debugging
    let mut user = create_user();
    let bank_name = "reshima a".to_string();
    let course_list = vec![
        "236303".to_string(),
        "236512".to_string(),
        "1".to_string(),
        "2".to_string(),
    ];
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name, course_list, 5.5, 0);
    let res = handle_bank_rule_processor.accumulate_credit();
    // check it adds the type
    assert_eq!(user.degree_status.course_statuses[0].r#type, None);
    assert_eq!(user.degree_status.course_statuses[1].r#type, None);
    assert_eq!(user.degree_status.course_statuses[2].r#type, None);
    assert_eq!(user.degree_status.course_statuses[3].r#type, None);
    assert_eq!(
        user.degree_status.course_statuses[4].r#type,
        Some("reshima a".to_string())
    );
    assert_eq!(
        user.degree_status.course_statuses[5].r#type,
        Some("reshima a".to_string())
    );
    assert_eq!(user.degree_status.course_statuses[6].r#type, None);
    assert_eq!(user.degree_status.course_statuses[7].r#type, None);
    assert_eq!(user.degree_status.course_statuses.len(), 8);

    // check sum credits
    assert_eq!(res, 11.5);
}

#[test]
async fn test_rule_accumulate_courses() {
    // for debugging
    let mut user = create_user();
    let bank_name = "Project".to_string();
    let course_list = vec![
        "236303".to_string(),
        "236512".to_string(),
        "1".to_string(),
        "2".to_string(),
    ];
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 1);
    let mut count_courses = 0;
    let res = handle_bank_rule_processor.accumulate_courses(&mut count_courses);
    // check it adds the type
    assert_eq!(user.degree_status.course_statuses[0].r#type, None);
    assert_eq!(user.degree_status.course_statuses[1].r#type, None);
    assert_eq!(user.degree_status.course_statuses[2].r#type, None);
    assert_eq!(user.degree_status.course_statuses[3].r#type, None);
    assert_eq!(
        user.degree_status.course_statuses[4].r#type,
        Some("Project".to_string())
    );
    assert_eq!(
        user.degree_status.course_statuses[5].r#type,
        Some("Project".to_string())
    );
    assert_eq!(user.degree_status.course_statuses[6].r#type, None);
    assert_eq!(user.degree_status.course_statuses[7].r#type, None);
    assert_eq!(user.degree_status.course_statuses.len(), 8);

    //check num courses
    assert_eq!(count_courses, 3);

    // check sum credits
    assert_eq!(res, 6.0);
}

#[test]
async fn test_rule_chain() {
    let mut user = create_user();
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
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name.clone(), course_list.clone(), 0.0, 0);
    // user didn't finish a chain
    let res = handle_bank_rule_processor.chain(&chains, &mut chain_done);

    assert!(chain_done.is_empty());
    assert_eq!(res, 7.0);

    // ---------------------------------------------------------------------------
    user = create_user();
    chains.push(vec!["114052".to_string(), "114054".to_string()]); // user finished the chain [114052, 114054]
    let handle_bank_rule_processor = BankRuleHandler {
        user: &mut user,
        bank_name,
        course_list,
        courses: &HashMap::new(),
        credit_overflow: 0.0,
        courses_overflow: 0,
        catalog_replacements: &HashMap::new(),
        common_replacements: &HashMap::new(),
    };
    let res = handle_bank_rule_processor.chain(&chains, &mut chain_done);
    assert_eq!(user.degree_status.course_statuses[0].r#type, None);
    assert_eq!(user.degree_status.course_statuses[1].r#type, None);
    assert_eq!(
        user.degree_status.course_statuses[2].r#type,
        Some("science chain".to_string())
    );
    assert_eq!(
        user.degree_status.course_statuses[3].r#type,
        Some("science chain".to_string())
    );
    assert_eq!(user.degree_status.course_statuses[4].r#type, None);
    assert_eq!(user.degree_status.course_statuses[5].r#type, None);
    assert_eq!(user.degree_status.course_statuses[6].r#type, None);
    assert_eq!(user.degree_status.course_statuses[7].r#type, None);
    assert_eq!(user.degree_status.course_statuses.len(), 8);

    // check sum credits
    assert_eq!(
        chain_done,
        vec!["פיסיקה 2".to_string(), "פיסיקה 3".to_string()]
    );
    assert_eq!(res, 7.0);
}

#[test]
async fn test_rule_malag() {
    // for debugging
    let mut user = create_user();
    let bank_name = "MALAG".to_string();
    let course_list = vec!["1".to_string(), "2".to_string()]; // this list shouldn't affect anything
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
    let res = handle_bank_rule_processor.malag(&["324057".to_string()]);

    // check it adds the type
    assert_eq!(user.degree_status.course_statuses[0].r#type, None);
    assert_eq!(user.degree_status.course_statuses[1].r#type, None);
    assert_eq!(user.degree_status.course_statuses[2].r#type, None);
    assert_eq!(user.degree_status.course_statuses[3].r#type, None);
    assert_eq!(user.degree_status.course_statuses[4].r#type, None);
    assert_eq!(user.degree_status.course_statuses[5].r#type, None);
    assert_eq!(
        user.degree_status.course_statuses[6].r#type,
        Some("MALAG".to_string())
    );
    assert_eq!(user.degree_status.course_statuses[7].r#type, None);
    assert_eq!(user.degree_status.course_statuses.len(), 8);

    // check sum credits
    assert_eq!(res, 2.0);
}

#[test]
async fn test_rule_sport() {
    // for debugging
    let mut user = create_user();
    let bank_name = "SPORT".to_string();
    let course_list = vec!["1".to_string(), "2".to_string()]; // this list shouldn't affect anything
    let handle_bank_rule_processor = BankRuleHandler {
        user: &mut user,
        bank_name,
        course_list,
        courses: &HashMap::new(),
        credit_overflow: 0.0,
        courses_overflow: 0,
        catalog_replacements: &HashMap::new(),
        common_replacements: &HashMap::new(),
    };
    let res = handle_bank_rule_processor.sport();

    // check it adds the type
    assert_eq!(user.degree_status.course_statuses[0].r#type, None);
    assert_eq!(user.degree_status.course_statuses[1].r#type, None);
    assert_eq!(user.degree_status.course_statuses[2].r#type, None);
    assert_eq!(user.degree_status.course_statuses[3].r#type, None);
    assert_eq!(user.degree_status.course_statuses[4].r#type, None);
    assert_eq!(user.degree_status.course_statuses[5].r#type, None);
    assert_eq!(user.degree_status.course_statuses[6].r#type, None);
    assert_eq!(
        user.degree_status.course_statuses[7].r#type,
        Some("SPORT".to_string())
    );
    assert_eq!(user.degree_status.course_statuses.len(), 8);

    // check sum credits
    assert_eq!(res, 1.0);
}

#[test]
async fn test_modified() {
    // for debugging
    let mut user = create_user();
    user.degree_status.course_statuses[0].r#type = Some("reshima alef".to_string()); // the user modified the type of 104031 to be reshima alef
    user.degree_status.course_statuses[0].modified = true;
    let bank_name = "hova".to_string();
    let course_list = vec!["104031".to_string(), "104166".to_string()]; // although 104031 is in the list, it shouldn't be taken because the user modified its type
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
    let mut missing_credit_dummy = 0.0;
    let res = handle_bank_rule_processor.all(&mut missing_credit_dummy);

    // check it adds the type
    assert_eq!(
        user.degree_status.course_statuses[0].r#type,
        Some("reshima alef".to_string())
    );
    assert_eq!(
        user.degree_status.course_statuses[1].r#type,
        Some("hova".to_string())
    );
    assert_eq!(user.degree_status.course_statuses[2].r#type, None);
    assert_eq!(user.degree_status.course_statuses[3].r#type, None);
    assert_eq!(user.degree_status.course_statuses[4].r#type, None);
    assert_eq!(user.degree_status.course_statuses[5].r#type, None);
    assert_eq!(user.degree_status.course_statuses[6].r#type, None);
    assert_eq!(user.degree_status.course_statuses[7].r#type, None);
    assert_eq!(
        user.degree_status.course_statuses[8].r#type,
        Some("hova".to_string())
    ); // We considered 104031 as reshima alef so the user didn't complete this course for hova
    assert_eq!(user.degree_status.course_statuses.len(), 9);

    // check sum credits
    assert_eq!(res, 0.0);

    let mut user = create_user();
    user.degree_status.course_statuses[2].r#type = Some("hova".to_string()); // the user modified the type of 114052 to be hova
    user.degree_status.course_statuses[2].modified = true;
    user.degree_status.course_statuses[3].r#type = Some("reshima alef".to_string()); // the user modified the type of 114054 to be reshima alef
    user.degree_status.course_statuses[3].modified = true;
    let bank_name = "hova".to_string();
    let mut course_list = vec!["104031".to_string(), "104166".to_string()];
    // create DegreeStatusHandler so we can run the function get_modified_courses
    let catalog = Catalog {
        ..Default::default()
    };
    let degree_status_handler = DegreeStatusHandler {
        user: &mut user,
        course_banks: Vec::new(),
        catalog,
        courses: HashMap::new(),
        malag_courses: Vec::new(),
        credits_overflow_map: HashMap::new(),
        missing_credit_map: HashMap::new(),
        courses_overflow_map: HashMap::new(),
    };

    course_list.extend(degree_status_handler.get_modified_courses(&bank_name)); // should take only 114052

    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
    let res = handle_bank_rule_processor.all(&mut missing_credit_dummy);

    // check it adds the type
    assert_eq!(
        user.degree_status.course_statuses[2].r#type,
        Some("hova".to_string())
    );
    assert_eq!(
        user.degree_status.course_statuses[3].r#type,
        Some("reshima alef".to_string())
    );
    assert_eq!(user.degree_status.course_statuses.len(), 8);

    // check sum credits
    assert_eq!(res, 9.0);
}

#[test]
async fn test_specialization_group() {
    // for debugging
    let mut user = create_user();
    let bank_name = "specialization group".to_string();
    let course_list = vec![
        "104031".to_string(),
        "104166".to_string(),
        "114052".to_string(),
        "1".to_string(),
        "2".to_string(),
        "114054".to_string(),
        "236303".to_string(),
        "236512".to_string(),
        "394645".to_string(),
    ];
    let specialization_groups = SpecializationGroups {
        groups_list: vec![
            SpecializationGroup {
                // The user completed this group with 114052, 104031
                name: "math".to_string(),
                courses_sum: 2,
                course_list: vec![
                    "114052".to_string(),
                    "104166".to_string(),
                    "1".to_string(),
                    "104031".to_string(),
                ],
                mandatory: Some(vec![vec!["104031".to_string(), "104166".to_string()]]), // need to accomplish one of the courses 104031 or 104166 or 1
            },
            SpecializationGroup {
                // Although the user completed 4 courses from this group and the mandatory courses,
                // he didn't complete this group because 104031 was taken to "math"
                name: "physics".to_string(),
                courses_sum: 4,
                course_list: vec![
                    "104031".to_string(),
                    "114054".to_string(),
                    "236303".to_string(),
                    "236512".to_string(),
                    "104166".to_string(),
                ],
                mandatory: Some(vec![
                    vec!["114054".to_string(), "236303".to_string()],
                    vec!["104166".to_string(), "236512".to_string()],
                ]),
            },
            SpecializationGroup {
                // The user didn't complete the mandatory course
                name: "other".to_string(),
                courses_sum: 1,
                course_list: vec![
                    "104031".to_string(),
                    "114054".to_string(),
                    "236303".to_string(),
                    "236512".to_string(),
                    "104166".to_string(),
                    "394645".to_string(),
                ],
                mandatory: Some(vec![vec!["104166".to_string()]]),
            },
        ],
        groups_number: 2,
    };
    let handle_bank_rule_processor =
        create_bank_rule_handler!(&mut user, bank_name, course_list, 0.0, 0);
    let mut completed_groups = Vec::<String>::new();
    let res = handle_bank_rule_processor
        .specialization_group(&specialization_groups, &mut completed_groups);

    // check sum credits
    assert_eq!(res, 19.5);

    // check completed groups
    assert_eq!(completed_groups, vec!["math".to_string()]);

    // check it adds the type and the group name
    assert_eq!(
        user.degree_status.course_statuses[0].r#type,
        Some("specialization group".to_string())
    );
    assert_eq!(
        user.degree_status.course_statuses[0].specialization_group_name,
        Some("math".to_string())
    );

    // check it doesn't add a group name to course which is not chosen for specific group
    assert_eq!(
        user.degree_status.course_statuses[1].specialization_group_name,
        None
    );
}

// ------------------------------------------------------------------------------------------------------
// Test core function in a full flow
// ------------------------------------------------------------------------------------------------------

async fn run_calculate_degree_status(file_name: &str, catalog: &str) -> UserDetails {
    dotenv().ok();
    let options = mongodb::options::ClientOptions::parse(CONFIG.uri)
        .await
        .expect("failed to parse URI");

    let client = mongodb::Client::with_options(options).unwrap();
    // Ping the server to see if you can connect to the cluster
    client
        .database("admin")
        .run_command(bson::doc! {"ping": 1}, None)
        .await
        .expect("failed to connect to db");
    println!("Connected successfully.");
    let contents = std::fs::read_to_string(format!("../docs/{}", file_name))
        .expect("Something went wrong reading the file");

    let course_statuses =
        parser::parse_copy_paste_data(&contents).expect("failed to parse courses data");

    let obj_id = bson::oid::ObjectId::from_str(catalog).expect("failed to create oid");
    let catalog = db::services::get_catalog_by_id(&obj_id, &client)
        .await
        .expect("failed to get catalog");
    let mut user = UserDetails {
        catalog: None,
        degree_status: DegreeStatus {
            course_statuses,
            ..Default::default()
        },
        modified: false,
    };
    let vec_courses = db::services::get_all_courses(&client)
        .await
        .expect("failed to get all courses");
    let malag_courses = db::services::get_all_malags(&client)
        .await
        .expect("failed to get all malags")[0]
        .malag_list
        .clone();
    calculate_degree_status(
        catalog,
        course::vec_to_map(vec_courses),
        malag_courses,
        &mut user,
    );
    user
}

#[test]
async fn test_missing_credit() {
    let user =
        run_calculate_degree_status("pdf_ctrl_c_ctrl_v.txt", "61a102bb04c5400b98e6f401").await;
    //FOR VIEWING IN JSON FORMAT
    // std::fs::write(
    //     "degree_status.json",
    //     serde_json::to_string_pretty(&user.degree_status).expect("json serialization failed"),
    // )
    // .expect("Unable to write file");

    // check output
    assert_eq!(
        user.degree_status.course_bank_requirements[0].credit_requirement,
        Some(2.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[0].credit_completed,
        1.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[1].credit_requirement,
        Some(6.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[1].credit_completed,
        6.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[2].course_requirement,
        Some(1)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[2].course_completed,
        0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[3].credit_requirement,
        Some(18.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[3].credit_completed,
        9.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[4].credit_requirement,
        Some(2.5)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[4].course_requirement,
        Some(1)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[4].credit_completed,
        0.0
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[4].course_completed,
        0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[5].credit_requirement,
        Some(8.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[5].credit_completed,
        3.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[6].credit_requirement,
        Some(72.5)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[6].credit_completed,
        72.5
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[7].credit_requirement,
        Some(7.5)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[7].credit_completed,
        3.5
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[8].credit_requirement,
        Some(2.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[8].credit_completed,
        2.0
    );

    assert_eq!(
        user.degree_status.overflow_msgs[0],
        messages::credit_overflow_detailed_msg("פרויקט", "רשימה א")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[1],
        messages::missing_credit_msg(1.0, "חובה", "רשימה ב")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[2],
        messages::credit_overflow_msg(6.0, "בחירת העשרה", "בחירה חופשית")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[3],
        messages::credit_leftovers_msg(5.5)
    );
}

#[test]
async fn test_overflow_credits() {
    let user =
        run_calculate_degree_status("pdf_ctrl_c_ctrl_v_2.txt", "61a102bb04c5400b98e6f401").await;
    //FOR VIEWING IN JSON FORMAT
    // std::fs::write(
    //     "degree_status.json",
    //     serde_json::to_string_pretty(&user.degree_status).expect("json serialization failed"),
    // )
    // .expect("Unable to write file");

    // check output
    assert_eq!(
        user.degree_status.course_bank_requirements[0].credit_completed,
        1.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[1].credit_completed,
        6.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[2].course_completed,
        0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[3].credit_completed,
        9.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[4].credit_completed,
        0.0
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[4].course_completed,
        0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[5].credit_completed,
        8.0
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[5].message,
        Some(messages::completed_chain_msg(&["פיסיקה 2פ'".to_string()]))
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[6].credit_requirement,
        Some(73.5)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[6].credit_completed,
        73.5
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[7].credit_requirement,
        Some(6.5)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[7].credit_completed,
        5.5
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[8].credit_requirement,
        Some(2.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[8].credit_completed,
        0.0
    );

    assert_eq!(
        user.degree_status.overflow_msgs[0],
        messages::credit_overflow_detailed_msg("פרויקט", "רשימה א")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[1],
        messages::credit_overflow_msg(1.5, "חובה", "רשימה ב")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[2],
        messages::credit_overflow_msg(0.5, "שרשרת מדעית", "רשימה ב")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[3],
        messages::credit_leftovers_msg(0.0)
    );
}

#[test]
async fn test_software_engineer_itinerary() {
    let user =
        run_calculate_degree_status("pdf_ctrl_c_ctrl_v_3.txt", "61d84fce5c5e7813e895a27d").await;
    // //FOR VIEWING IN JSON FORMAT
    // std::fs::write(
    //     "degree_status.json",
    //     serde_json::to_string_pretty(&user.degree_status).expect("json serialization failed"),
    // )
    // .expect("Unable to write file");

    assert_eq!(
        user.degree_status.course_bank_requirements[0].credit_completed,
        1.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[1].credit_completed,
        6.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[2].course_completed,
        1
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[3].credit_completed,
        6.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[4].credit_requirement,
        Some(15.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[4].credit_completed,
        9.5
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[5].credit_completed,
        8.0
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[5].message,
        Some(messages::completed_chain_msg(&[
            "פיסיקה 2".to_string(),
            "פיסיקה 3".to_string()
        ]))
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[6].credit_requirement,
        Some(101.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[6].credit_completed,
        82.5
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[7].credit_requirement,
        Some(14.5)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[7].credit_completed,
        2.0
    );

    assert_eq!(
        user.degree_status.course_bank_requirements[8].credit_requirement,
        Some(4.0)
    );
    assert_eq!(
        user.degree_status.course_bank_requirements[8].credit_completed,
        3.5
    );

    assert_eq!(
        user.degree_status.overflow_msgs[0],
        messages::credit_overflow_detailed_msg("פרויקט", "רשימה א")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[1],
        messages::credit_overflow_msg(2.0, "שרשרת מדעית", "רשימה ב")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[2],
        messages::credit_overflow_msg(2.0, "בחירת העשרה", "בחירה חופשית")
    );
    assert_eq!(
        user.degree_status.overflow_msgs[3],
        messages::credit_leftovers_msg(0.0)
    );
}
