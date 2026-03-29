import { useState, useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  type ColDef,
  type CellValueChangedEvent,
  themeQuartz,
} from "ag-grid-community";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import { GradeEditor } from "@/components/planner/grid-cells/grade-editor";
import {
  courseFromUserValidations,
  determineState,
} from "@/lib/course-validator";
import type { RowData } from "@/types/domain";
import type { CourseStatus } from "@/types/api";
import { useUiStore } from "@/stores/ui-store";

/* ------------------------------------------------------------------ */
/* Custom AG Grid theme — adapts to light/dark via CSS color-scheme   */
/* ------------------------------------------------------------------ */
const sogrimGridThemeLight = themeQuartz.withParams({
  headerBackgroundColor: "#f8f9fa",
  headerTextColor: "#24333c",
  headerFontWeight: 600,
  headerFontSize: 13,
  fontSize: 13,
  rowBorder: { color: "#e9ecef", width: 1, style: "solid" },
  borderColor: "#dee2e6",
  borderRadius: 0,
  rowHoverColor: "#f8f9fa",
  cellHorizontalPaddingScale: 0.8,
  headerColumnResizeHandleColor: "transparent",
  spacing: 6,
});
const sogrimGridThemeDark = themeQuartz.withParams({
  backgroundColor: "hsl(224 71% 4%)",
  foregroundColor: "hsl(213 31% 91%)",
  headerBackgroundColor: "hsl(223 47% 11%)",
  headerTextColor: "hsl(213 31% 91%)",
  headerFontWeight: 600,
  headerFontSize: 13,
  fontSize: 13,
  rowBorder: { color: "hsl(216 34% 17%)", width: 1, style: "solid" },
  borderColor: "hsl(216 34% 17%)",
  borderRadius: 0,
  rowHoverColor: "hsl(217 33% 17%)",
  cellHorizontalPaddingScale: 0.8,
  headerColumnResizeHandleColor: "transparent",
  spacing: 6,
});

interface CourseGridProps {
  courseStatuses: CourseStatus[];
  semester: string | null;
  bankNames: string[];
  onUpdate: (updatedStatuses: CourseStatus[]) => void;
  onDelete: (courseNumber: string) => void;
}

function courseStatusToRow(cs: CourseStatus): RowData {
  return {
    name: cs.course.name,
    courseNumber: cs.course._id,
    credit: cs.course.credit,
    state: cs.state,
    type: cs.type,
    grade: cs.grade,
    semester: cs.semester,
    sg_name: cs.specialization_group_name,
    msg: cs.additional_msg,
  };
}

function rowToCourseStatus(row: RowData, original: CourseStatus): CourseStatus {
  const credit =
    typeof row.credit === "string" ? parseFloat(row.credit) : row.credit;
  return {
    ...original,
    course: {
      ...original.course,
      credit: isNaN(credit) ? original.course.credit : credit,
      name: row.name || original.course.name,
    },
    grade: row.grade,
    state: (row.state as CourseStatus["state"]) || original.state,
    type: row.type,
    modified: true,
  };
}

export function CourseGrid({
  courseStatuses,
  semester,
  bankNames,
  onUpdate,
  onDelete,
}: CourseGridProps) {
  const isDark = useUiStore((s) => s.theme) === "dark";
  const gridRef = useRef<AgGridReact>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const semesterCourses = useMemo(
    () =>
      courseStatuses.filter((cs) => {
        if (cs.semester !== semester) return false;
        if (semester === null) {
          return (
            cs.grade === "פטור ללא ניקוד" || cs.grade === "פטור עם ניקוד"
          );
        }
        return true;
      }),
    [courseStatuses, semester]
  );

  const rowData = useMemo(
    () => semesterCourses.map(courseStatusToRow),
    [semesterCourses]
  );

  const isSemester0 = semester === null;

  const columnDefs = useMemo<ColDef<RowData>[]>(
    () => [
      {
        headerName: "קורס",
        field: "name",
        flex: 2.5,
        minWidth: 160,
        editable: true,
        filter: true,
        headerClass: "ag-header-center",
        cellClass: "ag-cell-center",
      },
      {
        headerName: "מס׳ קורס",
        field: "courseNumber",
        flex: 1.2,
        minWidth: 100,
        editable: false,
        headerClass: "ag-header-center",
        cellClass: "ag-cell-center",
      },
      {
        headerName: "נק״ז",
        field: "credit",
        flex: 0.8,
        minWidth: 70,
        editable: true,
        headerClass: "ag-header-center",
        cellClass: "ag-cell-center",
        valueParser: (params) => {
          const val = parseFloat(params.newValue);
          return isNaN(val) ? params.oldValue : val;
        },
      },
      {
        headerName: "ציון",
        field: "grade",
        flex: 1,
        minWidth: 90,
        editable: true,
        headerClass: "ag-header-center",
        cellClass: "ag-cell-center",
        cellEditor: GradeEditor,
        cellEditorParams: {
          isSemester0,
        },
        cellEditorPopup: true,
      },
      {
        headerName: "קטגוריה",
        field: "type",
        flex: 1.8,
        minWidth: 130,
        editable: !isSemester0,
        headerClass: "ag-header-center",
        cellClass: "ag-cell-center",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["", ...bankNames],
        },
      },
      {
        headerName: "סטטוס",
        field: "state",
        flex: 1,
        minWidth: 90,
        editable: false,
        headerClass: "ag-header-center",
        cellClass: "ag-cell-center",
        cellRenderer: (params: { value: string }) => {
          const state = params.value;
          const variant =
            state === "הושלם"
              ? "success-muted"
              : state === "לא הושלם"
                ? "destructive-outline"
                : state === "בתהליך"
                  ? "info-outline"
                  : "muted-outline";
          return (
            <Badge variant={variant} className="text-[10px] px-1.5 py-0 leading-5">
              {state}
            </Badge>
          );
        },
      },
      {
        headerName: "מחק",
        field: undefined,
        width: 64,
        maxWidth: 64,
        editable: false,
        sortable: false,
        filter: false,
        headerClass: "ag-header-center",
        cellClass: "ag-cell-center",
        cellRenderer: (params: { data: RowData | undefined }) => {
          if (!params.data) return null;
          const courseNumber = params.data.courseNumber;
          return (
            <button
              onClick={() => onDelete(courseNumber)}
              className="flex items-center justify-center h-full w-full text-muted-foreground hover:text-destructive transition-colors"
              title="מחק קורס"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          );
        },
      },
    ],
    [bankNames, isSemester0, onDelete]
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<RowData>) => {
      if (!event.data) return;

      const updatedRow: RowData = { ...event.data };

      // Recompute state if grade changed
      if (event.colDef.field === "grade") {
        updatedRow.state = determineState(updatedRow.grade);
      }

      // Validate
      const allRows = rowData.filter(
        (r) => r.courseNumber !== updatedRow.courseNumber
      );
      const result = courseFromUserValidations(updatedRow, allRows, false);

      if (result.error) {
        setToast({ message: result.msg, type: "error" });
        // Revert the edit
        event.node.setData({
          ...event.data,
          [event.colDef.field!]: event.oldValue,
        });
        return;
      }

      // Apply the validated row
      event.node.setData(result.newRowData);

      // Build updated CourseStatus array for the parent
      const updatedStatuses = courseStatuses.map((cs) => {
        if (cs.course._id === result.newRowData.courseNumber) {
          return rowToCourseStatus(result.newRowData, cs);
        }
        return cs;
      });

      onUpdate(updatedStatuses);
    },
    [courseStatuses, rowData, onUpdate]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: false,
      sortable: true,
    }),
    []
  );

  // Compute height: header(40) + rows * rowHeight(40) + 2px border
  const gridHeight = Math.max(
    120,
    Math.min(600, semesterCourses.length * 40 + 42)
  );

  return (
    <div className="space-y-0">
      <div
        className="w-full overflow-hidden rounded-t-lg border"
        style={{ height: gridHeight }}
      >
        <AgGridReact<RowData>
          ref={gridRef}
          theme={isDark ? sogrimGridThemeDark : sogrimGridThemeLight}
          modules={[AllCommunityModule]}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          enableRtl={true}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          onCellValueChanged={onCellValueChanged}
          domLayout="normal"
          animateRows={true}
          headerHeight={38}
          rowHeight={40}
          getRowId={(params) => params.data.courseNumber}
          noRowsOverlayComponent={() => (
            <span className="text-muted-foreground text-sm">
              אין קורסים בסמסטר זה
            </span>
          )}
        />
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
