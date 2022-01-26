import { Box, Button, TextField, Typography } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  heIL,
} from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import { useStore } from "../../../../../hooks/useStore";
import { Course } from "../../../../../types/data-types";
import { SearchOption } from "../../../../../types/ui-types";
import { SearchFiled } from "../../../../Search/SearchField";

interface RuleAccCreditProps {
  bankName: string;
  bankCredit: number;
}
const RuleAccCreditComp: React.FC<RuleAccCreditProps> = ({
  bankName,
  bankCredit,
}) => {
  const {
    dataStore: {
      getCoursesByBankRule,
      currentCatalog,
      removeCourseFromBank,
      addCourseToBank,
      getCourseById,
      editBankCredit,
    },
    uiStore: { currentSelectedCourse, setCurrentSelectedCourse },
  } = useStore();

  const [trigger, setTrigger] = React.useState<boolean>(false);
  const coursesForRule = useMemo(
    () => getCoursesByBankRule(bankName),
    [currentCatalog, trigger]
  );

  const onChangeValue = (so: SearchOption) => {
    const course = getCourseById(so._id);
    if (course) {
      setCurrentSelectedCourse(course);
    }
  };

  const [pageSize, setPageSize] = React.useState<number>(20);

  const handleRemoveCourseFromBank = (courseId: string) => {
    removeCourseFromBank(courseId);
    setTrigger(!trigger);
  };

  const handleAddCourseToBank = () => {
    addCourseToBank(currentSelectedCourse._id, bankName);
    setTrigger(!trigger);
  };

  const columns: GridColDef[] = [
    { field: "_id", headerName: "מספר הקורס", width: 150 },
    {
      field: "name",
      headerName: "שם הקורס",
      width: 300,
    },
    {
      field: "credit",
      headerName: "נק״ז",
      type: "number",
      width: 100,
    },
    {
      field: "remove",
      headerName: "מחק קורס מהבנק",
      width: 150,
      renderCell: (params: GridRenderCellParams<Course>) => (
        <Button
          onClick={() => handleRemoveCourseFromBank(params.id.toString())}
          color="error"
          variant="outlined"
        >
          מחק
        </Button>
      ),
    },
  ];

  const handleCreditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    editBankCredit(+event.target.value, bankName);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mt: 1, mb: 4 }}>
      <Typography variant="h5"> {bankName} </Typography>
      <Box
        sx={{
          m: 1,
          alignSelf: "center",
          border: "1px solid #d1d1d1",
          borderRadius: 2,
          maxWidth: "80%",
          p: 1,
        }}
      >
        <Typography>
          בבנק זה הינו בחירה - צבירת נק״ז. כלומר, על הסטודנט להשלים סך נקודות
          זכות מתוך קבוצת הקורסים של בנק דרישה זה.
        </Typography>
      </Box>
      <TextField
        sx={{ m: 1, maxWidth: "80%", alignSelf: "center" }}
        type="tel"
        name="credit"
        required
        id="outlined-name"
        label="סך הנקודות הדרושות לבנק"
        value={bankCredit}
        onChange={handleCreditChange}
      />
      <div style={{ height: 400, width: "100%", marginBottom: 5 }}>
        <DataGrid
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
          getRowId={(row) => row._id}
          pagination
          rows={coursesForRule}
          columns={columns}
          localeText={heIL.components.MuiDataGrid.defaultProps.localeText}
        />
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, m: 2 }}>
          <SearchFiled
            searchLable={currentSelectedCourse?.name ?? "חפש קורס"}
            searchType={"course-name"}
            onChangeValue={onChangeValue}
          />
          <Button
            onClick={handleAddCourseToBank}
            variant="outlined"
            color="info"
          >
            הוסף קורס לבנק
          </Button>
        </Box>
      </div>
    </Box>
  );
};

export const RuleAccCredit = observer(RuleAccCreditComp);
