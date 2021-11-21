import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CourseBankReq } from '../../../../types/data-types';
import { Box, CircularProgress } from '@mui/material';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export interface RequirmentItemProps {
  bankRequirment: CourseBankReq;
}

export const RequirmentItem: React.FC<RequirmentItemProps> = ({
  bankRequirment
}) => {

  const { course_bank_name, credit_complete, credit_requirment } = bankRequirment;

  const progress = credit_complete / credit_requirment * 100;
  const subtitle = `השלמת ${credit_complete} מתוך ${credit_requirment} נק״ז` // TODO: add done/not done , types

  const ProgressCircular: React.FC<{value: number;}> = ({
    value,
  }) => { // Export to FC & typing
    return (
      <>
      <Box sx={{ position: 'relative', display: 'inline-flex', marginLeft: '8px' }}>
      <CircularProgress color={'secondary'} variant="determinate" value={value} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
        >{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
    </>
    )
  } 

  return (
    <Card sx={{ minWidth: 350, maxWidth: 450, margin: 1 }}>
      <CardHeader 
        avatar={
          <ProgressCircular value={progress} />
        }       
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        title={<Typography> {course_bank_name} </Typography>}
        subheader={subtitle}
      />            
      <CardActions disableSpacing>        
        <IconButton aria-label="more-info-req">
          <InfoOutlinedIcon />
        </IconButton>        
        <IconButton aria-label="finish-req">
          {progress >= 100 ? <DoneOutlinedIcon /> : null}
        </IconButton>
      </CardActions>      
    </Card>
  );
}