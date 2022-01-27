import { GridColumns, GridRowsProp } from "@mui/x-data-grid";
import { renderCategoryEditInputCell } from "./EditCategoryCell";
import { renderGradeEditInputCell } from "./EditGradeCell";

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
  },
  {
    field: "credit",
    headerName: "נק״ז",
    type: "number",
    width: 125,
    editable: true,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "grade",
    headerName: "ציון",
    width: 200,
    editable: true,
    headerAlign: "center",
    align: "center",
    renderEditCell: renderGradeEditInputCell,
  },
  {
    field: "type",
    headerName: "קטגוריה",
    width: 170,
    editable: true,
    headerAlign: "center",
    align: "center",
    renderEditCell: renderCategoryEditInputCell,
  },
  {
    field: "state",
    headerName: "סטאטוס",

    width: 125,
    editable: false,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "actions",
    headerName: "פעולות",

    width: 125,
    editable: true,
    headerAlign: "center",
    align: "center",
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
