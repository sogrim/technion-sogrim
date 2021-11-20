use crate::core::{CreditOverflow, Catalog, Rule};
use crate::course::{CourseBank, CourseTableRow};

// Catalog tlat shnati 2019-2020
pub fn build_catalog_tlat_shnati() -> Catalog {
    Catalog {
        id: bson::oid::ObjectId::new(),
        name: "מדמח תלת שנתי".to_string(),
        course_banks: vec![
            CourseBank {
                name: "חובה".to_string(),
                rule: Rule::All,
                credit: 73.5, // change this,
                message: "".to_string(), // check if necessary
            },
            CourseBank {
                name: "שרשרת מדעית".to_string(),
                rule: Rule::Chains(
                    vec![
                        vec![114075],
                        vec![114052,114054],
                        vec![134058,134020], 
                        vec![124120,125801],
                        vec![124120,124510],
                        vec![124120,114052],
                    ]
                ),
                credit: 8.0,
                message: "".to_string(), // check if necessary
            },
            CourseBank {
                name: "מתמטי נוסף".to_string(),
                rule: Rule::Accumulate,
                credit: 2.5,
                message: "".to_string(), // check if necessary
            },
            CourseBank {
                name: "רשימה א".to_string(),
                rule: Rule::Accumulate,
                credit: 15.0,
                message: "".to_string(), // check if necessary
            },
            CourseBank {
                name: "רשימה ב".to_string(),
                rule: Rule::Accumulate,
                credit: 6.0,
                message: "".to_string(), // check if necessary
            },
            CourseBank {
                name: "פרויקט".to_string(),
                rule: Rule::Accumulate,
                credit: 3.0,
                message: "".to_string(), // check if necessary
            },
            CourseBank {
                name: "בחירת העשרה".to_string(),
                rule: Rule::Malag,
                credit: 6.0,
                message: "".to_string(), // check if necessary
            },
            CourseBank {
                name: "חינוך גופני".to_string(),
                rule: Rule::Sport,
                credit: 2.0,
                message: "".to_string(), // check if necessary
            },
            CourseBank {
                name: "בחירה חופשית".to_string(),
                rule: Rule::FreeChoice,
                credit: 2.0,
                message: "".to_string(), // check if necessary
            },
        ],
        course_table: vec![ // Need to think how to handle english courses
            // hova
            CourseTableRow {
                number: 324033,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 104031,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 104166,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234114,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234129,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 104032,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 114071,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234124,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234125,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234141,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 094412,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 104134,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234218,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 044252,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234292,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234118,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234123,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 234247,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 236343,
                course_banks: vec!["חובה".to_string()]
            },
            CourseTableRow {
                number: 236360,
                course_banks: vec!["חובה".to_string()]
            },

            // Math courses
            CourseTableRow {
                number: 104135,
                course_banks: vec!["מתמטי נוסף".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104033,
                course_banks: vec!["מתמטי נוסף".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104174,
                course_banks: vec!["מתמטי נוסף".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104122,
                course_banks: vec!["מתמטי נוסף".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104142,
                course_banks: vec!["מתמטי נוסף".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104285,
                course_banks: vec!["מתמטי נוסף".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104295,
                course_banks: vec!["מתמטי נוסף".to_string(), "רשימה ב".to_string()]
            },

            //sciensce chain
            CourseTableRow {
                number: 114075,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 114052,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 114054,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 114073,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 114101,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 114246,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 124120,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 125001,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 125801,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 124510,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 134058,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 134020,
                course_banks: vec!["שרשרת מדעית".to_string(), "רשימה ב".to_string()]
            },

            //Reshima alef
            CourseTableRow {
                number: 234301,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 234302,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 234303,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 234304,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 234306,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 234313,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 234325,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 234326,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 234329,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 234493,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 234901,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236026,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236200,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236270,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236278,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236268,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236268,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236299,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236303,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236304,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236305,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236306,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236307,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236308,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236309,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236310,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236311,
                course_banks: vec!["רשימה א".to_string()]
            },CourseTableRow {
                number: 236313,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236315,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236319,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236321,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236322,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236323,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236324,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236328,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236329,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236330,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236332,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236333,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236334,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236336,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236339,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236340,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236341,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236342,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236345,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236346,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236347,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236348,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236349,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236350,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236351,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236356,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236357,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236358,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236359,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236361,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236363,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236366,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236368,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236369,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236370,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236371,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236372,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236373,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236374,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236375,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236376,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236377,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236378,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236379,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236381,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236388,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236490,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236491,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236496,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236499,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236500,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236501,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236502,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236503,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236504,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236506,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236508,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236509,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236510,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236512,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236513,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236515,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236518,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236520,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236521,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236522,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236523,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236524,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236525,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236526,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236612,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236698,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236700,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236703,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236712,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236715,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236716,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236719,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236729,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236754,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236755,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236756,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236757,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236760,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236777,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236779,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236780,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236781,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236790,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236827,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236828,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236860,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236861,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236862,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236873,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236874,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 236875,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236927,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236941,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236950,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236951,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236990,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 236991,
                course_banks: vec!["רשימה א".to_string(), "פרויקט".to_string()]
            },
            CourseTableRow {
                number: 238739,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 238900,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 238901,
                course_banks: vec!["רשימה א".to_string()]
            },
            CourseTableRow {
                number: 238902,
                course_banks: vec!["רשימה א".to_string()]
            },
            
            // רשימה ב
            CourseTableRow {
                number: 036044,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 044105,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 044127,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 044131,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 044137,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 044157,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 044167,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 044169,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 044202,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 046001,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 046201,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 046206,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 046332,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 046880,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 046925,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 046993,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 048878,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 048921,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 086761,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 094222,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 094313,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 09314,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 094323,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 094325,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 094334,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 094423,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 094564,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 094591,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 096224,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 096250,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 096262,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 096326,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 096411,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 097317,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104157,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104165,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104172,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104177,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104192,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104221,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104223,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104276,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 104279,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 106378,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 106383,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 115203,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 115204,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 114036,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 116217,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 116354,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 124503,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 134019,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 134082,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 134113,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 134128,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 134119,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 134142,
                course_banks: vec!["רשימה ב".to_string()]
            },
            CourseTableRow {
                number: 214909,
                course_banks: vec!["רשימה ב".to_string()]
            },
        ],
        credit_overflows: vec![
            CreditOverflow {
                from: "חובה".to_string(),
                to: "רשימה ב".to_string(),
            },
            CreditOverflow {
                from: "רשימה א".to_string(),
                to: "רשימה ב".to_string(),
            },
            CreditOverflow {
                from: "פרויקט".to_string(),
                to: "רשימה א".to_string(),
            },
            CreditOverflow {
                from: "שרשרת מדעית".to_string(),
                to: "רשימה ב".to_string(),
            },
            CreditOverflow {
                from: "מתמטי נוסף".to_string(),
                to: "רשימה ב".to_string(),
            },
            CreditOverflow {
                from: "רשימה ב".to_string(),
                to: "בחירה חופשית".to_string(),
            },
            CreditOverflow {
                from: "בחירת העשרה".to_string(),
                to: "בחירה חופשית".to_string(),
            },
             CreditOverflow {
                from: "חינוך גופני".to_string(),
                to: "בחירה חופשית".to_string(),
            },
        ]
    }
}