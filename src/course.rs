use std::collections::HashMap;
use rocket::http::Status;

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