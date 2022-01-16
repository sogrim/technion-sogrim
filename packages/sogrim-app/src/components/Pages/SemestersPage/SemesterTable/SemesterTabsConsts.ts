export interface RowData {
  name: string;
  courseNumber: string;
  credit: string | number;
  state: string;
  type: string;
  grade: string;
  semester: string;
  msg?: string;
}

export interface HeadCell {
  disablePadding: boolean;
  id: keyof RowData;
  label: string;
  numeric: boolean;
}

export const headCells: readonly HeadCell[] = [
  {
    id: "name",
    numeric: false,
    disablePadding: true,
    label: "קורס",
  },
  {
    id: "courseNumber",
    numeric: false,
    disablePadding: false,
    label: "מס׳ קורס",
  },
  {
    id: "credit",
    numeric: true,
    disablePadding: false,
    label: "נק״ז",
  },
  {
    id: "grade",
    numeric: false,
    disablePadding: false,
    label: "ציון",
  },
  {
    id: "type",
    numeric: true,
    disablePadding: false,
    label: "קטגוריה",
  },
  {
    id: "state",
    numeric: true,
    disablePadding: false,
    label: "סטאטוס",
  },
];

export const courseStateOptions = ["הושלם", "לא הושלם", "לא רלוונטי", "בתהליך"];

export const courseGradeOptions = [
  "עבר",
  "נכשל",
  "פטור ללא ניקוד",
  "פטור עם ניקוד",
  "לא השלים",
];

export const emptyRow = {
  courseNumber: "",
  name: "",
  grade: "",
  state: "",
  type: "",
  credit: "0",
  semester: "",
};

export enum UpdateUserDetailsAction {
  AfterEdit = "AfterEdit",
  AfterAdd = "AfterAdd",
  AfterDelete = "AfterDelete",
}
