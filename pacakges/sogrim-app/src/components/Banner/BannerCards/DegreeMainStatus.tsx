import { Box, Button, Card, CardActions, CardContent, Typography } from '@mui/material';
import { DegreeStatusBar } from './DegreeStatusBar';


export const DegreeMainStatus: React.FC = ({ children }) => {
  const totalCredit = 118.5;
  const pointsDone = 59;
  const catalogName = "מדעי המחשבי תלת שנתי 2018-19"
  return (    
    <Card sx={{ minWidth: 275 }}>
    <CardContent>
      <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
        סטאטוס תואר
      </Typography> 
      <DegreeStatusBar />   
      <Typography sx={{ fontSize: 22 }} color="text.primary">
        {`השלמת ${pointsDone} מתוך ${totalCredit} נקודות`}
      </Typography>               
      <Button sx={{ display: 'flex', justifyContent: 'center'}} size="small">{catalogName}</Button>   
    </CardContent>    
    
  </Card>            
     
  );
};
