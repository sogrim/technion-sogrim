//

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct UserDetails{
    pub courses: Vec<CourseDisplay>, //from parser
    pub catalog : bson::oid::ObjectId,
    pub degree_status: DegreeStatus,
}
    
#[derive(Default, Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct User {
    pub _id : bson::oid::ObjectId,
    pub name: String,
    pub details : Option<UserDetails>,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub enum CourseState{
    Complete,
    InProgress,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub enum Rules {
    All, //  כמו חובה פקולטית.
    Accumulate(u8), // לצבור איקס נקודות מתוך הבנק. למשל, רשימה א'
    Chain(Vec<Vec<Course>>), // למשל שרשרת מדעית.
    SpecializationGroups(Vec<SpecializationGroup>),
    
    Wildcard(bool), // קלף משוגע עבור להתמודד עם   
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct Course{
    pub number : u32,
    pub credit: u8,
    pub name: String,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct CourseDisplay{
    pub course: Course,
    pub r#type : Option<String>,
    pub semester : f32,
    pub grade : u8,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct CourseStatus{
    pub course : CourseDisplay,
    pub state : CourseState,   
    pub r#type: Option<String>, // if none, nissan cries 
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct Requirement{
    /*
    בזין הזה יש את כל הבנקים והאם בוצעו או לא בכל קטלוג
    */
    pub course_bank_name: String,
    pub credit_requirment: f32,
    pub credit_complete: f32,
    // TODO planing ...
    pub message: Option<String>,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct DegreeStatus {
    pub course_statuses: Vec<CourseStatus>,
    pub course_bank_requirements: Vec<Requirement>, // 
    pub credit_overflow: Option<Vec<String>>, // זליגות של נקז ואיך טיפלנו בהם
    pub total_credit: f32,   
}

pub struct Catalog{
    pub _id : bson::oid::ObjectId,
    pub name: String,
    pub course_banks: Vec<CourseBanks>,
    pub courses_table: Vec<CourseTableRow>
}
pub struct CourseBanks{
    pub name: String, // for example, Hova, Rshima A.
    pub rules: Rules,
    pub messege: String, //
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct SpecializationGroup {
    pub name: String,
    pub credit: u8,
    pub mandatory: Option<(Vec<u32>, Logic)>,
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub enum Logic {
    OR,
    AND,
}

pub struct CourseTableRow {
    pub number: u32,
    pub course_banks: Vec<String> // שמות הבנקים. שימו לב לקבוצת ההתמחות
    
}