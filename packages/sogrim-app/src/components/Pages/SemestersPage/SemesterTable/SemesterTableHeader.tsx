import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { headCells } from './SemesterTabsConsts';

export const SemesterTableHeader: React.FC = () => {
  
  return (
    <TableHead>
      <TableRow>        
        {headCells.map((headCell) => (
          <TableCell
            align='center'
            key={headCell.id}                 
          >            
              {headCell.label}
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