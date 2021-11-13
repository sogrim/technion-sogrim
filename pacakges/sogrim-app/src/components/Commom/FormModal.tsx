import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Link, Theme } from '@mui/material';

export interface FormModalProps {
  handleClose: () => void;
  open: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({ handleClose, open}) => {
 
  const [ ugText, setUgText] = React.useState<String>('');

  // No debounce needed.
  const handleChangeTextField = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: check prevent.
    e.preventDefault();
    setUgText(e.target.value)    
  }
  const handleSend = () => {       
    // TODO:
    console.log(ugText.split('\n'));
    handleClose();
  }
    return (    
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>יבא קורסים</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ניתן ליבא את הקורסים שביצאתם מגיליון הציונים. נכנסים ל-ug ומעתיקים את תוכן הגליון לכאן.
            יבוא קורסים ידרוס את כלל הקורסים והנתונים הקודמים שלך!
          </DialogContentText>
          <Link color={ (theme: Theme) => theme.palette.secondary.dark} href="http://ug3.technion.ac.il/Tadpis.html" underline="hover" target="_blank" rel="noopener">
          {'עבור לגיליון הציונים בלימודי הסמכה'}
          </Link>
          <TextField
            autoFocus
            fullWidth
            margin= "dense"
            id="outlined-multiline-static"
            label="העתק לכאן את גיליון הציונים"
            multiline
            rows={4}
            placeholder="הכנס לגיליון הציונים ב-ug, והעתק את כולו לכאן."
            onChange={handleChangeTextField}
        />          
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSend}>שלח</Button>
          <Button onClick={handleClose}>בטל</Button>
        </DialogActions>
      </Dialog>   
  );
}