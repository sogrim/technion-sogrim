import {Catalog, CourseState, SemesterTerm, User, UserCourse} from './sogrim-app-types';


const catalogExmaple: Catalog = {
    displayName: '2018-2019 תלת שנתי',
    id: '1234-ss-aa-1234',
    maslul: '3 years',
    yearOfPublish: '2018-2019',      
}
/*
Get All Catalogs Example:
Should return ***ALL** valid catalogs.
*/
const catalogsInit: Catalog[] = [
    catalogExmaple,
    {
        displayName: '2019-2020 תלת שנתי',
        id: '12das4-ss-aa-1234',
        maslul: '4 yers',
        yearOfPublish: '2019-2020',      
    },
    {
        displayName: '2019-2020 ביו-אינפורמטיקה',
        id: '12das4-s321-asdaa-1234',
        maslul: '4 years bioinfo',
        yearOfPublish: '2019-2020',      
    }
]

const course1: UserCourse = {
    id: '103006', // real course number (this is not the real one for infi...)
    displayName: 'חשבון אינפיטיסימלי 1מ׳',
    points: 5.5,
    courseType: 'CSMandatory', // course types comes as string from server.
    TakenInSemester: {
        yeaer: '2018-2019',
        term: SemesterTerm.Fall,
    },
    grade: 56, // optional
    status: CourseState.Completed,
    editedByUser: false, // Means that data comes from Parsing gilion zionim...    
    placeHolder: false, // Means that a real course.    
}

const course2: UserCourse = {
    id: '263263',
    displayName: 'פרוייקט בבינה מלאכותית',
    points: 3,
    courseType: 'CSProject', // course types comes as string from server.
    TakenInSemester: { // user can set futer semeter - for planning
        yeaer: '2022-2023',
        term: SemesterTerm.Spring,
    },
    status: CourseState.Planning, // 
    editedByUser: true, // Means that the user insert this course and    
    placeHolder: false, // Means that a real course.        
}

// דוגמא די מורכבת על איך אני אמור לקבל ״מידע חסר״ עבור שרשראות מסוימות. נדבר על זה בזום.
const course3: UserCourse = {
    id: 'cs-sience-mandatory-000000', // special id for placeholer for each type and category!
    displayName: 'שרשרת מדעית',
    points: 8,
    courseType: 'CSSience', // course types comes as string from server.
    TakenInSemester: { // with the recomandded semster - if placeholders.
        yeaer: '2021-2022',
        term: SemesterTerm.Spring,
    },
    status: CourseState.UnCompleted, // Not done yet. will show the user that he neet to do this...
    editedByUser: false, 
    placeHolder: true, // Means that the server send it to the clinet, for indicate that user have uncomplete courses.
    extraDetails: { // נדבר על זה בזום. זה אובייקט גנרי עבור גמישות של שפה משותפת.
        text: 'שרשרת מדעית זה חשוב, צריך ככה וככה וככה וככה וכו׳ וכו׳',
        extraDetailsType: 'CSSienceExtraDetails',
        payLoadJson: {} as JSON, // יאפשר לנו גמישות בשליחת מידע עבור כל מיני שרשראות ואופציות בחירה מעניינות. שפה משותפת 
    }
}

const course4: UserCourse = {
    id: '236512', // special id for placeholer for each type and category!
    displayName: 'תורת הקומפליציה',
    points: 3,
    courseType: 'CSMandatory', // course types comes as string from server.
    TakenInSemester: { // with the recomandded semster - if placeholders.
        yeaer: '2021-2022',
        term: SemesterTerm.Fall,
    },
    status: CourseState.UnCompleted, // Not done yet. will show the user that he neet to do this...
    editedByUser: false, 
    placeHolder: false,     
}

// חשוב רק להבהיר - שבכל קריאה לשרת, ירדו רשימת כלל הקורסים - אלו שבוצעו, ואלו שלא בוצעו. את הפליטור אני עושה בצד הלקוח.
// כלומר, סכום הנקודות של כל הקורסים באובייקט זה צריך להיות עבור כל הקטלוג.
// נדבר על זה בזום!
const userCoursesExample: UserCourse[] = [
    course1,
    course2,
    course3,
    course4    
]

/*
Get User State Example 1:
*/
const NissoDummyUser: User = {
    id: 'afgfd-4234-dfs-43242',
    displayName: 'Nisso Ohana',
    selectedCatalog: catalogExmaple,
    userCourses: userCoursesExample,  
}

