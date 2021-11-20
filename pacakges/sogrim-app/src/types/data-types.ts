export type Catalog = {
    name: string;
    _id: {
        $oid: string;
    };
};

export type CourseStatus = {

};

export type DegreeStatus = {

};

export type UserState = {
    course_statuses: CourseStatus;
    degree_status: DegreeStatus
    catalog: Catalog;
};