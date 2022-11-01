import { GridColumns, GridComparatorFn } from "@mui/x-data-grid";
import { renderDeleteCell } from "./DeleteRowCell";
import { renderCategoryEditInputCell } from "./EditCategoryCell";
import { renderGradeEditInputCell } from "./EditGradeCell";

const gradeComparator: GridComparatorFn = (v1: any, v2: any) => {
  if (isNaN(+v1!!) && !isNaN(+v2!!)) {
    return 1;
  } else if (!isNaN(+v1!!) && isNaN(+v2!!)) {
    return -1;
  } else {
    return v2 - v1;
  }
};

export const columns: GridColumns = [
  {
    field: "name",
    headerName: "קורס",
    flex: 250,
    editable: true,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "courseNumber",
    headerName: "מס׳ קורס",
    flex: 125,
    editable: false,
    headerAlign: "center",
    align: "center",
    description:
      "לא ניתן לערוך מס׳ קורס. אם רוצים מס׳ קורס אחר, הוסיפו קורס חדש",
  },
  {
    field: "credit",
    headerName: "נק״ז",
    type: "number",
    flex: 95,
    editable: true,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "grade",
    headerName: "ציון",
    flex: 200,
    editable: true,
    headerAlign: "center",
    align: "center",
    sortComparator: gradeComparator,
    renderEditCell: renderGradeEditInputCell,
  },
  {
    field: "type",
    headerName: "קטגוריה",
    flex: 200,
    editable: true,
    headerAlign: "center",
    align: "center",
    renderEditCell: renderCategoryEditInputCell,
  },
  {
    field: "state",
    headerName: "סטאטוס",
    flex: 125,
    editable: false,
    headerAlign: "center",
    align: "center",
    description: "לא ניתן לערוך שדה זה. הוא מתעדכן בהתאם לציון",
  },
  {
    field: "delete",
    headerName: "מחק",
    flex: 50,
    editable: false,
    headerAlign: "center",
    align: "center",
    renderCell: renderDeleteCell,
    hideSortIcons: true,
    disableColumnMenu: true,
    sortable: false,
  },
];
