import { Box, Theme, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { observer } from 'mobx-react-lite';
import { FormModal } from "../Commom/FormModal";
import { SogrimButton } from "../Commom/SogrimButton";
import { useStore } from "../../hooks/useStore";
import { ExportGilion } from "./BannerDialogs/ExportGilion";
import { SelectCatalog } from "./BannerDialogs/SelectCatalog";
import { useAuth } from "../../hooks/useAuth";
import useComputeEndGame from "../../hooks/apiHooks/useComputeEndGame";

export const BannerTitleComp: React.FC = () => {
  const [coursesModalOpen, coursesModalsetOpen] = React.useState(false);  
  const [catalogsModalOpen, catalogsModalsetOpen] = React.useState(false);  
  const [triggerCompute, setTriggerCompute] = React.useState(false);  
  
  const { uiStore: {
    userDisplyName,
  }} = useStore();

  const { userAuthToken } = useAuth();

  const { data, isLoading, isError} = useComputeEndGame(userAuthToken, triggerCompute);

  useEffect(() => {
    if (isError) {
      // TODO: error state
    } else if (data && !isLoading) {
      setTriggerCompute(false);      
    }
  }, [data, isLoading, isError]);


  const coursesHandleClickOpen = () => {
    coursesModalsetOpen(true);
  };

  const coursesHandleClose = () => {
    coursesModalsetOpen(false);
  };

  const catalogsHandleClickOpen = () => {
    catalogsModalsetOpen(true);
  };

  const catalogsHandleClose = () => {
    catalogsModalsetOpen(false);
  };

  const handleTriggerCompute = () => {
    setTriggerCompute(true);
  }
  
  
  return <Box>
    <Typography variant="h2" noWrap sx={sxAppTitle}> 
             {`שלום ${userDisplyName ?? ','}`}
        </Typography>       
        <Box sx={{display: 'flex', flexDirection: 'row' ,marginTop: '10px', gap: '10px'}}> 
        <SogrimButton onClick={handleTriggerCompute}>
          סגור את התואר!
        </SogrimButton>       
        <SogrimButton onClick={coursesHandleClickOpen}>
          יבא קורסים
        </SogrimButton>
        <SogrimButton onClick={catalogsHandleClickOpen}>
          בחר קטלוג
        </SogrimButton>
        <FormModal dialogContent={<ExportGilion handleClose={coursesHandleClose} />} handleClose={coursesHandleClose} open={coursesModalOpen}/>
        <FormModal dialogContent={<SelectCatalog handleClose={catalogsHandleClose} />} handleClose={catalogsHandleClose} open={catalogsModalOpen}/>
        </Box>
  </Box> 
}

export const BannerTitle = observer(BannerTitleComp);

const sxAppTitle = {
  color: (theme: Theme) => theme.palette.common.white,  
  display: { xs: 'none', md: 'flex', alignItems: 'center' }  ,
  fontWeight: 'bold',
}
