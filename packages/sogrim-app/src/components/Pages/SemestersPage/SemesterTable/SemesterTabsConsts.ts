export interface RowData {    
    name: string;
    courseNumber: string;
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
    numeric: false,
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