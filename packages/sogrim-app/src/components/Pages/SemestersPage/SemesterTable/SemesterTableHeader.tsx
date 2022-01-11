import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { visuallyHidden } from '@mui/utils';
import { RowData, headCells } from './SemesterTabsConsts';
import { Order } from './SemesterTableUtils';
import { Box } from '@mui/material';

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof RowData) => void;
  order: Order;
  orderBy: string;
}

export const SemesterTableHeader: React.FC<EnhancedTableProps> = ({
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