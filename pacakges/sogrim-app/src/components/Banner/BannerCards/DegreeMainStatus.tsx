import { Button, Card, CardContent, Typography } from '@mui/material';
import { DegreeStatusBar } from './DegreeStatusBar';
import useUserState from '../../../hooks/apiHooks/useUserState';
import { useState, useEffect } from 'react';


export const DegreeMainStatus: React.FC = ({ children }) => {
  
  const { data } = useUserState();
  const [ totalCredit, setTotalCredit] = useState<number>(118.5); // TODO: get from server.
  const [ pointsDone, setPointsDone] = useState<number>(0);
  const [ catalogName, setCatalogName] = useState<string>("מדעי המחשבי תלת שנתי 2019-2020");
  
  // TODO: loading? or loading to all the banner!
  useEffect(() => {    
    if (data?.details?.degree_status?.total_credit) {
      const total = data?.details?.degree_status?.total_credit;
      setPointsDone(total);
    }    
  }, [data])

  const progress = (pointsDone / totalCredit) >= 1 ? 100 : ((pointsDone / totalCredit) * 100);
  return (    
    <Card sx={{ minWidth: 275 }}>
    <CardContent>
      <Typography sx={{ fontSize: 18 }} color="text.secondary" gutterBottom>
        סטאטוס תואר
      </Typography> 
      <DegreeStatusBar progress={progress}/>   
      <Typography sx={{ fontSize: 22 }} color="text.primary">
        {`השלמת ${pointsDone} מתוך ${totalCredit} נקודות`}
      </Typography>               
      <Button sx={{ display: 'flex', justifyContent: 'center'}} size="small">{catalogName}</Button>   
    </CardContent>    
    
  </Card>            
     
  );
};
