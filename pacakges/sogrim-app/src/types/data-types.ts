export type Catalog = {
    name: string;
    total_credit: number;
    description: string;
    _id: {
        $oid: string;        
    };
};

export enum CourseState {
    Complete = 'Complete',
    NotComplete = 'NotComplete',
}

export type Course = {
    credit: number;
    name: string;
    _id: number;
}

type GradeNumber = {
        Grade?: number;
    }
export type Grade = null | 'ExemptionWithoutCredit' | 'ExemptionWithCredit' | GradeNumber;

export type CourseStatus = {
    course: Course;
    grade: Grade;
    semester: string;
    state: CourseState;
    type: string;

};

export const ACCUMULATE_COURSES = 'accumulate courses';

export type CourseBankReq = { // TODO: check with Liad after apdated.
    bank_rule_name: string;
    course_bank_name: string;
    credit_completed: number;
    credit_requirment: number;
    course_completed: number;
    course_requirement: number;
    message?: string;
    done?: boolean;
    type: string; 
}

export type DegreeStatus = {
    course_bank_requirements: CourseBankReq[];
    course_statuses: CourseStatus[];
    overflow_msgs: string[];
    total_credit: number;
};

export type UserDetails = {
    degree_status: DegreeStatus;
    catalog: Catalog;   
    modified: boolean;
}

export type UserState = {
    details: UserDetails;
    _id: string;
};