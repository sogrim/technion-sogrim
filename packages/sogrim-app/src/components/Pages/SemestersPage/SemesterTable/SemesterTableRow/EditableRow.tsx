import AutoFixNormalOutlinedIcon from '@mui/icons-material/AutoFixNormalOutlined';
import { Grid, IconButton, MenuItem, TableCell, TextField, Tooltip  } from "@mui/material";
import { useState } from "react";
import { RowData } from "../SemesterTabsConsts";
import { EditActionCell } from "./EditActionCell";

export interface EditableRowProps {
    editRow: RowData;
    handleEditChange: any;
    handleSave: any;
    handleCancel: any;
    labelId: string;
}

// TODO: changes mock to real data from server with memo
// TODO: types
const courseStateMock = [
  {
    value: 'בוצע',
    label: 'בוצע',
  },
  {
    value: 'לא בוצע',
    label: 'לא בוצע',
  },  
];

const courseTypeMock = [
  {
    value: 'חובה',
  },
  {
    value: 'שרשרת מדעית',
  },
  {
    value: 'רשימה א׳',
  }, 
  {
    value: 'רשימה ב׳',
  },   
  {
    value: 'ספורט',
  }, 
  {
    value: 'פרוייקט',
  }, 
];

const EditableRowComp: React.FC<EditableRowProps> = ({
    editRow,
    handleEditChange,
    handleCancel,
    handleSave,
    labelId,
}) => {      
  const { name, courseNumber, credit, grade, state, type} = editRow;

  const [ gradeToggle, setGradeToggle] = useState<boolean>(true);

  const gradeToggleClick = () => setGradeToggle(!gradeToggle);

  return (
      <>
          <TableCell
              align='center'
              component="th"
              id={labelId}
              scope="row"
              padding="none"
              width={'250px'}
          >
              <TextField id="course-name" name="name" onChange={handleEditChange}                       
                        label={name} variant="outlined" size="small"/>                
          </TableCell>
          <TableCell align="center" width={'150px'}>
              <TextField id="course-number"
                          
                          label={courseNumber} variant="outlined" size="small"/>                                
          </TableCell>
          <TableCell align="center" width={'50px'}>
              <TextField id="course-credit" 
                          
                          label={credit} variant="outlined" size="small" type="number"/>  
          </TableCell>
            <TableCell align="center" width={'250px'} >
              <Grid container justifyContent={'center'} direction={'row'}>
                  <Tooltip title='ציון לא מספרי' arrow> 
                  <IconButton color="primary" onClick={gradeToggleClick}>
                    <AutoFixNormalOutlinedIcon />
                  </IconButton>
                  </Tooltip>
                { gradeToggle ?
                  <TextField id="course-grade"                        
                          label={grade} variant="outlined" size="small" type="number"/> 
                  : 
                  <TextField select id="course-grade" label={state} variant="outlined" size="small" sx={{width: '170px'}}> 
              {   courseStateMock.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                  {option.value}
                  </MenuItem>
        ))}
              </TextField>
                    }
              </Grid>
          </TableCell>
            <TableCell align="center" width={'100px'}>
              <TextField id="course-type" select
                        
                        label={type} variant="outlined" size="small" fullWidth> 
                {courseTypeMock.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                          {option.value}
                          </MenuItem>
                ))}
              </TextField>
          </TableCell>
          <TableCell align="center" width={'100x'}>
              <TextField select id="course-state" label={state} variant="outlined" size="small" fullWidth> 
              {courseStateMock.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                  {option.value}
                  </MenuItem>
        ))}
              </TextField>
          </TableCell>    
          <EditActionCell row={editRow} handleSave={handleSave} handleCancel={handleCancel}/>      
      </>
  )
}

export const EditableRow = EditableRowComp;