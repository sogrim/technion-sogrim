import * as React from 'react';
import Dialog from '@mui/material/Dialog';
export interface FormModalProps {
  handleClose: () => void;
  dialogContent: React.ReactNode;
  open: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({ handleClose, open, dialogContent}) => {

    return (    
      <Dialog open={open} onClose={handleClose} fullWidth PaperProps={{style: {overflowY: 'visible'}}}>
        {dialogContent}
      </Dialog>   
  );
}