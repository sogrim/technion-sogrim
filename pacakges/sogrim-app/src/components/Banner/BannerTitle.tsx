import { Box, Theme, Typography } from "@mui/material";
import React from "react";
import { observer} from 'mobx-react-lite';
import { FormModal } from "../Commom/FormModal";
import { SogrimButton } from "../Commom/SogrimButton";
import { useStore } from "../../hooks/useStore";

export const BannerTitleComp: React.FC = () => {
  const [open, setOpen] = React.useState(false);  

  const { uiStore: {
    userDisplyName,
  }} = useStore();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  
  return <Box>
    <Typography variant="h2" noWrap sx={sxAppTitle}> 
             {`שלום ${userDisplyName ?? ','}`}
        </Typography>       
        <Box sx={{display: 'flex', flexDirection: 'row' ,marginTop: '10px', gap: '10px'}}> 
        <SogrimButton>
          סגור את התואר!
        </SogrimButton>       
        <SogrimButton onClick={handleClickOpen}>
          יבא קורסים
        </SogrimButton>
        <FormModal handleClose={handleClose} open={open}/>
        </Box>
  </Box> 
}

export const BannerTitle = observer(BannerTitleComp);

const sxAppTitle = {
  color: (theme: Theme) => theme.palette.common.white,  
  display: { xs: 'none', md: 'flex', alignItems: 'center' }  ,
  fontWeight: 'bold',
}
