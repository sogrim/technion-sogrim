import { GridColumns, GridRowsProp } from "@mui/x-data-grid";
import { validCourseNumber } from "./course-validator";

export const columns: GridColumns = [
  {
    field: "name",
    headerName: "קורס",
    width: 250,
    editable: true,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "courseNumber",
    headerName: "מס׳ קורס",
    width: 125,
    editable: false,
    headerAlign: "center",
    align: "center",
    // // preProcessEditCellProps: (params) => {
    // //   let isValid = false;
    // //   const value = params.props.value;
    // //   if (typeof value === "string" || value instanceof String) {
    // //     console.log("dsadsasadas");
    // //     isValid = validCourseNumber(String(value));
    // //   }
    // //   return { ...params.props, error: !isValid };
    // },
  },
  {
    field: "credit",
    headerName: "נק״ז",
    type: "number",
    width: 125,
    editable: true,
    headerAlign: "center",
    align: "center",
    preProcessEditCellProps: (params) => {
      //   const isValid = validateEmail(params.props.value);
      const isValid = true;
      return { ...params.props, error: !isValid };
    },
  },
  {
    field: "grade",
    headerName: "ציון",
    //type: "dateTime",
    width: 125,
    editable: true,
    headerAlign: "center",
    align: "center",
    preProcessEditCellProps: (params) => {
      //   const isValid = validateEmail(params.props.value);
      const isValid = true;
      return { ...params.props, error: !isValid };
    },
  },
  {
    field: "type",
    headerName: "קטגוריה",
    width: 125,
    editable: true,
    headerAlign: "center",
    align: "center",
    preProcessEditCellProps: (params) => {
      //   const isValid = validateEmail(params.props.value);
      const isValid = true;
      return { ...params.props, error: !isValid };
    },
  },
  {
    field: "state",
    headerName: "סטאטוס",
    //type: "dateTime",
    width: 125,
    editable: false,
    headerAlign: "center",
    align: "center",

    preProcessEditCellProps: (params) => {
      //   const isValid = validateEmail(params.props.value);
      const isValid = true;
      return { ...params.props, error: !isValid };
    },
  },
  {
    field: "actions",
    headerName: "פעולות",
    //type: "dateTime",
    width: 125,
    editable: true,
    headerAlign: "center",
    align: "center",

    preProcessEditCellProps: (params) => {
      //   const isValid = validateEmail(params.props.value);
      const isValid = true;
      return { ...params.props, error: !isValid };
    },
  },
];

export const rows: GridRowsProp = [
  {
    courseNumber: 1,
    name: "קורס טוב",
    credit: 3.5,
    grade: "12",
    state: "הושלם",
    type: "חובה",
    actions: "",
  },
  {
    courseNumber: 4,
    name: "קורס טוב",
    credit: 15,
    grade: "12",
    state: "הושלם",
    type: "חובה",
  },
  {
    courseNumber: 3,
    name: "קורס טוב",
    credit: 3.5,
    grade: "12",
    state: "הושלם",
    type: "חובה",
    actions: "",
  },
  {
    courseNumber: 2,
    name: "קורס טוב",
    credit: 3.5,
    grade: "12",
    state: "הושלם",
    type: "חובה",
    actions: "",
  },
];
