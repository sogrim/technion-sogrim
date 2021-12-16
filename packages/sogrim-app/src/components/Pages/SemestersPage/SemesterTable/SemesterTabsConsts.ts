export interface RowData {    
    name: string;
    courseNumber: number; // TODO: convert to string., accordint to server.
    credit: number;
    state: string;
    type: string;
    grade: string;    
}

export interface HeadCell {
  disablePadding: boolean;
  id: keyof RowData;
  label: string;
  numeric: boolean;
}

export const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    numeric: false,
    disablePadding: true,
    label: 'קורס',
  },
  {
    id: 'courseNumber',
    numeric: true,
    disablePadding: false,
    label: 'מס׳ קורס',
  },
  {
    id: 'credit',
    numeric: true,
    disablePadding: false,
    label: 'נק״ז',
  },
  {
    id: 'grade',
    numeric: true,
    disablePadding: false,
    label: 'ציון',
  },
   {
    id: 'type',
    numeric: true,
    disablePadding: false,
    label: 'קטגוריה',
  },
  {
    id: 'state',
    numeric: true,
    disablePadding: false,
    label: 'סטאטוס',
  },  
];