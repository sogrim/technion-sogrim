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
}

const SemesterTableComp: React.FC<SemesterTableProps> = ({
    rows,
}) => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof RowData>('grade');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [dense, setDense] = React.useState(false);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof RowData,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {    
  };
 

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked);
  };

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center'}}>
      <Paper sx={{ width: '100%', mb: 2 }}>        
        <TableContainer sx={{ width: '1200px' }}>
          <Table
            
            aria-labelledby="tableTitle"
            size={dense ? 'small' : 'medium'}
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {/* if you don't need to support IE11, you can replace the `stableSort` call with:
              rows.slice().sort(getComparator(order, orderBy)) */}
              {stableSort(rows, getComparator(order, orderBy))                
                .map((row, index) => {
                  const isItemSelected = isSelected(row.name as string);
                  const labelId = `enhanced-table-checkbox-${index}`;
                  return (
                      < SemesterTableRow row={row} isItemSelected={isItemSelected} labelId={labelId} />                   
                  );
                })}              
            </TableBody>
          </Table>
        </TableContainer>        
      </Paper>
      {/* <FormControlLabel
        control={<Switch checked={dense} onChange={handleChangeDense} />}
        label="Dense padding"
      /> */}
    </Box>
  );
}

export const SemesterTable = observer(SemesterTableComp);