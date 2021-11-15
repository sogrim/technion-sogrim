use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use crate::core::*;

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct Course {
    #[serde(rename(serialize = "_id", deserialize = "_id"))]
    pub number : u32,
    pub credit: f32,
    pub name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum CourseState {
    Complete,
    NotComplete,
    InProgress,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CourseStatus {
    pub course: Course,
    pub state: Option<CourseState>,
    pub semester : Option<String>,
    pub grade : Option<Grade>,
    pub r#type : Option<String>, // if none, nissan cries
    pub additional_msg : Option<String>,
}

impl CourseStatus {
    pub fn passed(&self) -> bool {
        match &self.grade {
            Some(grade) => {
                match grade{
                    Grade::Grade(grade) => grade >= &55,
                    Grade::Binary(val) => *val,
                    Grade::ExemptionWithoutCredit => true,
                    Grade::ExemptionWithCredit => true,
                } 
            },
            None => false,
        }
    }

    pub fn set_state(&mut self){
        self.state = self.passed().then(||{
            CourseState::Complete
        }).or(Some(CourseState::NotComplete));
    }
    pub fn set_type(&mut self, r#type: String) -> &mut Self{
        self.r#type = Some(r#type);
        self
    }
    pub fn set_msg(&mut self, msg: String) -> &mut Self{
        self.additional_msg = Some(msg);
        self
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CourseBank {
    pub name: String, // for example, Hova, Rshima A.
    pub rule: Rule,
    pub credit: f32,
    pub messege: String,
}

#[derive(Default, Clone, Debug, Deserialize, Serialize)]
pub struct CourseTableRow {
    pub number: u32,
    pub course_banks: Vec<String> // שמות הבנקים. שימו לב לקבוצת ההתמחות
}

fn contains_course_number(str : &str) -> bool{
    for word in str.split_whitespace(){
        let course_number = word.parse::<u32>();
        match course_number{
            Ok(number) if 10000 < number && number < 999999 => return true,
            Ok(_) => continue,
            Err(_) => continue,
        }
    }
    false
}

pub fn validate_copy_paste_from_ug(ug_data: &str) -> Result<(), rocket::http::Status>{
    todo!("{}", ug_data)
}

pub fn parse_copy_paste_from_ug(ug_data: &str) -> Vec<CourseStatus>{
    let mut courses = HashMap::<u32, CourseStatus>::new();
    let mut semester = String::new();
    let mut semester_counter = 0;
    
    for line_ref in ug_data.split_terminator("\r\n"){
        let line = line_ref.to_string();
        
        semester = if line.contains("אביב") || line.contains("חורף") || line.contains("קיץ"){
            semester_counter += 1;
            format!("{}_{}", line.split_whitespace().next().unwrap(), semester_counter)
        }
        else {
            semester
        };
            
        if !contains_course_number(&line){
            continue;
        }

        let line_parts : Vec<_> = line.split('\t').collect();
        let grade_str = line_parts[0];
        let grade = match grade_str.parse::<u8>(){
            Ok(num) => Some(Grade::Grade(num)),
            Err(_) => {
                if grade_str == "פטור ללא ניקוד"{
                    Some(Grade::ExemptionWithoutCredit)
                }
                else if grade_str == "פטור עם ניקוד"{
                    Some(Grade::ExemptionWithCredit)
                }
                else if grade_str == "-"{
                    None
                }
                else{
                    Some(Grade::Binary(grade_str == "עבר"))
                }
            },
        };
        let course_parts : Vec<_> = line_parts[2].split_whitespace().collect();
        let credit = line_parts[1].parse::<f32>().unwrap();
        let number = course_parts.last().unwrap().parse::<u32>().unwrap();
        let name = course_parts[..course_parts.len() - 1].join(" ").trim().to_string();
        let mut course = CourseStatus{
            course : Course{
                number,
                credit,
                name,
            },
            semester : Some(semester.clone()),
            grade : grade.clone(),
            ..Default::default()
        };
        course.set_state();
        *courses.entry(number).or_insert(course) = course.clone();
    }
    courses.into_values().collect()
}

#[test]
fn test(){
    
    let contents = std::fs::read_to_string("ug_ctrl_c_ctrl_v.txt")
        .expect("Something went wrong reading the file");
    let mut courses_display = parse_copy_paste_from_ug(&contents);
    courses_display.sort_by(|a, b| a.course.credit.partial_cmp(&b.course.credit).unwrap() );
    for course_display in courses_display{
        println!("{:?}", course_display);
    };
}
#[test]
fn test1(){
    
    let degree_status = DegreeStatus{
        course_statuses: vec![
            CourseStatus{ 
                course: Course{ 
                    number: 234125, 
                    credit: 5.5, 
                    name: "אינפי 1 לניסנים".into() 
                }, 
                state: Some(CourseState::Complete), 
                semester: Some("חורף_1".into()), 
                grade: Some(Grade::Grade(98)), 
                r#type: Some("חובה".into()),
                additional_msg: None,
            },
            CourseStatus{ 
                course: Course{ 
                    number: 234126, 
                    credit: 5.0, 
                    name: "אינפי 2 לניסנים".into() 
                }, 
                state: Some(CourseState::NotComplete), 
                semester: Some("אביב_2".into()), 
                grade: Some(Grade::Grade(45)), 
                r#type: Some("חובה".into()),
                additional_msg: None,
            },
            CourseStatus{ 
                course: Course{ 
                    number: 234125, 
                    credit: 4.0, 
                    name: "אינפי 3 לניסנים".into() 
                }, 
                state: Some(CourseState::Complete), 
                semester: Some("חורף_3".into()), 
                grade: Some(Grade::Binary(true)), 
                r#type: Some("חובה".into()),
                additional_msg: None, 
            },
            CourseStatus{ 
                course: Course{ 
                    number: 234127, 
                    credit: 3.0, 
                    name: "קורס בחירה כלשהו".into() 
                }, 
                state: Some(CourseState::Complete), 
                semester: Some("חורף_3".into()), 
                grade: Some(Grade::ExemptionWithCredit), 
                r#type: Some("רשימה א'".into()),
                additional_msg: None, 
            },

        ],
        course_bank_requirements: vec![
            Requirement{ 
                course_bank_name: "חובה".into(), 
                credit_requirment: 84.0, 
                credit_complete: 9.5, 
                message: Some("תראה את ניסן הגבר הזה כמה אינפים הוא עשה".into()),
            },
            Requirement{ 
                course_bank_name: "בחירה חופשית".into(),  
                credit_requirment: 2.0, 
                credit_complete: 0.0, 
                message: None
            }
        ],
        credit_overflow_msgs: vec![
            r#"2.5 נק"ז עובר משרשרת מדעית לרשימה ב'"#.to_string(),
            r#"2.0 נק"ז עובר מרשימה ב' לבחירה חופשית"#.to_string(),
        ],
        total_credit: 76.5,
    };

    //let serialized = bson::to_bson(&degree_status).unwrap();
    std::fs::write(
        "degree_status_mock.json", 
    serde_json::to_string_pretty(&degree_status)
        .expect("json serialization failed")
    ).expect("Unable to write file");
}

#[test]
fn test2(){
    
    let course = Course{
        number: 234,
        credit: 2.5,
        name: "some_course".into(),
    };
    let serialized = bson::to_bson(&course).unwrap();
    println!("{}", serialized);
    let doc = bson::to_document(&serialized).unwrap();
    println!("{}", doc);
    let deserialized  = bson::from_document::<Course>(doc).unwrap();
    println!("{:?}", deserialized);
    
    let vec = vec![course.clone(), course];
    let serialized_vec = bson::to_bson(&vec).unwrap();
    println!("{}", serialized_vec);
    let doc_vec = bson::doc!{"vec" : serialized_vec};
    println!("{}", doc_vec);

}

#[rocket::async_test]
async fn test3(){
    let contents = std::fs::read_to_string("courses.txt")
        .expect("Something went wrong reading the file");
    let mut counter = 0;
    let mut unique_lines = std::collections::HashSet::new();
    let mut courses = Vec::new();
    let options = mongodb::options::ClientOptions::parse(
        "mongodb+srv://nbl_admin:sm3sw0rFjzMcQeW3@sogrimdev.7tmyn.mongodb.net/Development?retryWrites=true&w=majority")
    .await
    .unwrap();
    let client = mongodb::Client::with_options(options).unwrap();
    // Ping the server to see if you can connect to the cluster
    client
        .database("admin")
        .run_command(bson::doc! {"ping": 1}, None)
        .await
        .unwrap();
    println!("Connected successfully.");
    for line_ref in contents.split_terminator("\r\n"){
        //println!("{}", line_ref);
        if !unique_lines.insert(line_ref){
            continue;   
        };
        let res  = serde_json::from_str::<Course>(line_ref);
        if res.is_ok(){
            let course = res.unwrap();   
            // match client
            //     .database("debug")
            //     .collection::<Course>("Courses")
            //     .insert_one(
            //         course.clone(),
            //         None
            //     )
            //     .await{
            //         Ok(res) => println!("{:?}", res),
            //         Err(err) => eprintln!("{:?}", err),
            //     };
            courses.push(course); 
            counter += 1;
        }
        else{
            println!("{} --- {:?}", line_ref, res);
        }
    }
    let special_courses = vec![
        Course{
            number : 234129,
            credit : 3.0,
            name: r#"מב.לתורת הקבוצות ואוטומטים למדמ"ח"#.to_string(),
        },
        Course{
            number : 236716,
            credit : 3.0,
            name: r#"מודלים גאומטריים במערכות תיב"מ"#.to_string(),
        },
        Course{
            number : 104223,
            credit : 4.0,
            name: r#"מד"ח וטורי פוריה"#.to_string(),
        },
        Course{
            number : 104035,
            credit : 5.0,
            name: r#"משוואות דיפ' רגילות ואינפי 2ח'"#.to_string(),
        },
        Course{
            number : 46746,
            credit : 3.0,
            name: r#"אלג' ויישומים בראייה ממוחשבת"#.to_string(),
        },
    ];
    for special_course in special_courses.iter(){
        match client
            .database("debug")
            .collection::<Course>("Courses")
            .insert_one(
                special_course,
                None
            )
            .await{
                Ok(res) => println!("{:?}", res),
                Err(err) => eprintln!("{:?}", err),
            };
    }
    println!("{:?}", counter);
}