export type Course = {
  _id: string;
  credit: number;
  name: string;
};

export type ThinCatalog = {
  name: string;
  total_credit: number;
  description: string;
  _id: {
    $oid: string;
  };
};
export type Catalog = {
  _id: string;
  name: string;
  total_credit: string;
  description: string;
  course_banks: CourseBank[];
  credit_overflows: CreditOverFlows[];
  course_to_bank: { [key: string]: string }; // Mapping from CourseToBank object to mapping object.
  catalog_replacements: { [key: string]: { [key: number]: string }[] };
  common_replacements: { [key: string]: { [key: number]: string }[] };
};

// TODO: add קבוצות התמחות
export type CourseBank = {
  name: string;
  rule:
    | "All"
    | "AccumulateCredit"
    | "Malag"
    | "Sport"
    | "Elective"
    | AccumulateCoursesRule
    | ChainRule;
  credit: number;
};

export type CreditOverFlows = {
  from: string;
  to: string;
};

export type AccumulateCoursesRule = {
  AccumulateCourses: number;
};

export type ChainRule = {
  Chains: string[][]; // Each string is course id
};
