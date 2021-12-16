import { MenuItem, TableCell, TextField  } from "@mui/material";
import { observer } from "mobx-react-lite";
import { RowData } from "./SemesterTabsConsts";
export interface CRUDRowProps {
    row: RowData;
    labelId: string;
    handleChange(e: React.ChangeEvent<HTMLInputElement>, cellId: string): void;
}

// TODO: changes mock to real data from server
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

const CRUDRowComp: React.FC<CRUDRowProps> = ({
    row,    
    labelId,
    handleChange,
}) => {      
  const { name, courseNumber, credit, grade, state, type} = row;  

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
              <TextField id="course-name" 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, "course-name")}
                        label={name} variant="outlined" size="small"/>                
          </TableCell>
          <TableCell align="center" width={'200px'}>
              <TextField id="course-number" 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, "course-number")}
                          label={courseNumber} variant="outlined" size="small"/>                                
          </TableCell>
          <TableCell align="center" width={'50px'}>
              <TextField id="course-credit" 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, "course-credit")}
                          label={credit} variant="outlined" size="small" type="number"/>  
          </TableCell>
            <TableCell align="center" width={'100px'} >
              <TextField id="course-grade" 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, "course-grade")}
                        label={grade} variant="outlined" size="small" type="number"/>  
          </TableCell>
            <TableCell align="center" width={'200px'}>
              <TextField id="course-type" select
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, "course-type")}
                        label={type} variant="outlined" size="small" fullWidth> 
                {courseTypeMock.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                          {option.value}
                          </MenuItem>
                ))}
              </TextField>
          </TableCell>
          <TableCell align="center" width={'200px'}>
              <TextField select id="course-state" label={state} variant="outlined" size="small" fullWidth> 
              {courseStateMock.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                  {option.value}
                  </MenuItem>
        ))}
              </TextField>
          </TableCell>
      </>
  )
}

export const CRUDRow = observer(CRUDRowComp);