import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import { observer } from 'mobx-react-lite';
import { getComparator, Order, stableSort } from './SemesterTableUtils';
import { RowData } from './SemesterTabsConsts';
import { SemesterTableRow } from './SemesterTableRow';
import { Paper } from '@mui/material';
import useUserState from '../../../../hooks/apiHooks/useUserState';
import { useAuth } from "../../../../hooks/useAuth";
import { useStore } from "../../../../hooks/useStore";
import useUpdateUserState from '../../../../hooks/apiHooks/useUpdateUserState';
import { SemesterTableHeader } from './SemesterTableHeader';
export interface SemesterTableProps {
    rows: RowData[],
    semester: string;
}

const SemesterTableComp: React.FC<SemesterTableProps> = ({
    rows,
    semester,
}) => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof RowData>('grade');
  const [tableRows] = React.useState<RowData[]>(rows)

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof RowData,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

    const { userAuthToken } = useAuth();
    const { data } = useUserState(userAuthToken);
    const { mutate } = useUpdateUserState(userAuthToken)

    const { dataStore: {
        updateCourseInUserDetails,
    }} = useStore();

    const handleSave = (newRowData: RowData) => {
      if (data && data?.details) {
        const newUserDetails = updateCourseInUserDetails(newRowData, semester, data?.details)
        mutate(newUserDetails);
      }
    }
    
  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center'}}>
      <Paper sx={{ width: '100%', mb: 2 }}>        
        <TableContainer sx={{ width: '1200px' }}>
          <Table
            
            aria-labelledby="tableTitle"
            size={'small'}
          >
            <SemesterTableHeader
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>         
              {stableSort(tableRows, getComparator(order, orderBy))                
                .map((row, index) => {                  
                  const labelId = `enhanced-table-checkbox-${index}`;
                  return (
                      <SemesterTableRow row={row} labelId={labelId} handleSave={handleSave} key={index} />                   
                  );
                })}              
            </TableBody>
          </Table>
        </TableContainer>    
        {/* <TableFooter>
            Add a new row
        </TableFooter>     */}
      </Paper>      
    </Box>
  );
}

export const SemesterTable = observer(SemesterTableComp);