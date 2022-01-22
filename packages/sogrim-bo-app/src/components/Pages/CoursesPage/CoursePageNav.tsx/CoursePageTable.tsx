import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import { useStore } from "../../../../hooks/useStore";
import { DataGrid, GridColDef, heIL } from "@mui/x-data-grid";

interface CoursePageTableProps {}

const CoursePageTableComp: React.FC<CoursePageTableProps> = () => {
  const {
    dataStore: { courses },
    uiStore: { setCurrentSelectedCourse },
  } = useStore();

  const [pageSize, setPageSize] = React.useState<number>(20);

  const rows = useMemo(() => [...courses], [courses]);

  const handleClick = (row: any) => setCurrentSelectedCourse(row.row);

  return (
    <div style={{ height: 400, width: "100%", marginBottom: 5 }}>
      <DataGrid
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[5, 10, 20, 50, 100]}
        getRowId={(row) => row._id}
        onRowClick={(row) => handleClick(row)}
        pagination
        rows={rows}
        columns={columns}
        localeText={heIL.components.MuiDataGrid.defaultProps.localeText}
      />
    </div>
  );
};

export const CoursePageTable = observer(CoursePageTableComp);

const columns: GridColDef[] = [
  { field: "_id", headerName: "מספר הקורס", width: 150 },
  {
    field: "name",
    headerName: "שם הקורס",
    width: 400,
  },
  {
    field: "credit",
    headerName: "נק״ז",
    type: "number",
    width: 50,
  },
];
