import { GridColumns } from "@mui/x-data-grid";
import { renderDeleteCell } from "./DeleteRowCell";
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
    description:
      "לא ניתן לערוך מס׳ קורס. אם רוצים מס׳ קורס אחר, הוסיפו קורס חדש",
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
    description: "לא ניתן לערוך שדה זה. הוא מתעדכן בהתאם לציון",
  },
  {
    field: "actions",
    headerName: "פעולות",
    width: 100,
    editable: false,
    headerAlign: "center",
    align: "center",
    renderCell: renderDeleteCell,
  },
];
