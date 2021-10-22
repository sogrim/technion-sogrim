use std::collections::{HashMap, hash_map::Entry};
use rocket::http::{Status, ext::IntoCollection};

use crate::core::{Course, CourseState, CourseStatus, Grade};

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

fn parse_ug_courses(data: &str) -> String {
    let mut course_list_response = String::new();
    let mut lines_iter = data.lines();
    let mut course_id_to_grade : HashMap<String, String> = HashMap::new();
    while let Some(line) = lines_iter.next() {
        if contains_course_number(line){
            let line_vec : Vec<&str> = line.split_whitespace().collect();
            if line_vec[0].parse::<u32>().is_err() {
                course_id_to_grade
                    .insert(line_vec.last().unwrap().to_string(), "Exemption Without Credit".into());
            }
            else{
                course_id_to_grade
                    .insert(line_vec.last().unwrap().to_string(), line_vec[0].into());
            }
        }
    }
    for (course, grade) in course_id_to_grade{
        course_list_response += &format!("Course: {}, Grade: {}\n", course, grade);
    }
    course_list_response
}

#[post("/ug_courses", data = "<data>")]
pub async fn get_courses(data : Vec<u8>) -> Result<String, Status>{
    let decoded = String::from_utf8_lossy(&data).into_owned();
    Ok(parse_ug_courses(&decoded))
}

pub fn parse_copy_paste_from_ug(ug_data: String) -> Vec<CourseStatus>{
    let mut courses = HashMap::<u32, CourseStatus>::new();
    let mut semester = String::new();
    let mut semester_counter = 0;
    
    for line_ref in ug_data.split_terminator('\n'){
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
                    Some(Grade::ExemptionWithoutCredit)
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
        let course = CourseStatus{
            course : Course{
                number,
                credit,
                name,
            },
            semester : Some(semester.clone()),
            grade : grade.clone(),
            r#type: None,
            state: None,
        };
        *courses.entry(number).or_insert(course) = course.clone();
    }
    courses.into_values().collect()
}

#[test]
fn test(){
    let contents = std::fs::read_to_string("ug_ctrl_c_ctrl_v.txt")
        .expect("Something went wrong reading the file");
    let mut courses_display = parse_copy_paste_from_ug(contents);
    courses_display.sort_by(|a, b| a.course.credit.partial_cmp(&b.course.credit).unwrap() );
    for course_display in courses_display{
        println!("{:?}", course_display);
    };
}