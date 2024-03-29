import {
  GridColumns,
  GridComparatorFn,
  GridRenderCellParams,
} from "@mui/x-data-grid";
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

export const MAX_GRID_WIDTH = 1100;

export const columns = (
  isSemester0: boolean,
  editable: boolean = true
): GridColumns => [
  {
    field: "name",
    headerName: "קורס",
    flex: 250 / MAX_GRID_WIDTH,
    editable: editable,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "courseNumber",
    headerName: "מס׳ קורס",
    flex: 125 / MAX_GRID_WIDTH,
    editable: editable,
    headerAlign: "center",
    align: "center",
    description:
      "לא ניתן לערוך מס׳ קורס. אם רוצים מס׳ קורס אחר, הוסיפו קורס חדש",
  },
  {
    field: "credit",
    headerName: "נק״ז",
    type: "number",
    flex: 95 / MAX_GRID_WIDTH,
    editable: editable,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "grade",
    headerName: "ציון",
    flex: 200 / MAX_GRID_WIDTH,
    editable: editable,
    headerAlign: "center",
    align: "center",
    sortComparator: gradeComparator,
    renderEditCell: (params: GridRenderCellParams) =>
      renderGradeEditInputCell(params, isSemester0),
  },
  {
    field: "type",
    headerName: "קטגוריה",
    flex: 210 / MAX_GRID_WIDTH,
    editable: !isSemester0 && editable,
    headerAlign: "center",
    align: "center",
    renderEditCell: renderCategoryEditInputCell,
  },
  {
    field: "state",
    headerName: "סטטוס",
    width: 125,
    headerAlign: "center",
    align: "center",
    description: "לא ניתן לערוך שדה זה. הוא מתעדכן בהתאם לציון",
  },
  {
    field: "delete",
    headerName: "מחק",
    flex: 85 / MAX_GRID_WIDTH,
    editable: false,
    headerAlign: "center",
    align: "center",
    renderCell: renderDeleteCell,
    hideSortIcons: true,
    disableColumnMenu: true,
    sortable: false,
  },
];
