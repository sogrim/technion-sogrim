export enum CourseState {
    Completed = "Completed",
    UnCompleted = "UnCompleted",
    Planning  = "Planing",   
}

export enum SemesterTerm {
    Fall = 'Fall',
    Spring = 'Spring',
    Summer = 'Summer',
}

export type Catalog = {
    id: string;
    displayName: string;
    maslul: string;
    yearOfPublish: string;    
}

export type Semester = {
    yeaer: string;
    term: SemesterTerm;
}

export type extraDetails = {
    text: string;
    extraDetailsType: string;
    payLoadJson?: JSON;
}
export type UserCourse = {
    id: string;
    displayName: string;
    points: number;
    grade?: number
    TakenInSemester: Semester;
    status: CourseState;    
    courseType: string;    
    editedByUser: boolean;
    placeHolder: boolean;    
    extraDetails?: extraDetails;
}

export type User = {
    id: string;
    displayName: string;
    avater?: any;
    selectedCatalog: Catalog;
    userCourses: UserCourse[]; 

}