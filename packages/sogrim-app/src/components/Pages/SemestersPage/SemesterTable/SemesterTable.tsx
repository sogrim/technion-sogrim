import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { visuallyHidden } from '@mui/utils';
import { observer } from 'mobx-react-lite';
import { getComparator, Order, stableSort } from './SemesterTableUtils';
import { RowData, headCells } from './SemesterTabsConsts';
import { SemesterTableRow } from './SemesterTableRow';
import { Paper } from '@mui/material';
import useUserState from '../../../../hooks/apiHooks/useUserState';
import { useAuth } from "../../../../hooks/useAuth";
import { useStore } from "../../../../hooks/useStore";
import useUpdateUserState from '../../../../hooks/apiHooks/useUpdateUserState';

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof RowData) => void;
  order: Order;
  orderBy: string;
}

const EnhancedTableHead: React.FC<EnhancedTableProps> = ({
    order, orderBy, onRequestSort
}) => {
  
  const createSortHandler =
    (property: keyof RowData) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>        
        {headCells.map((headCell) => (
          <TableCell
            align='center'
            key={headCell.id}            
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        <TableCell
            align='center'
            key={'header-actions'}                                    
          >
              פעולות
          </TableCell>
      </TableRow>
    </TableHead>
  );
}

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
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>         
              {stableSort(tableRows, getComparator(order, orderBy))                
                .map((row, index) => {                  
                  const labelId = `enhanced-table-checkbox-${index}`;
                  return (
                      < SemesterTableRow row={row} labelId={labelId} handleSave={handleSave} key={index} />                   
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