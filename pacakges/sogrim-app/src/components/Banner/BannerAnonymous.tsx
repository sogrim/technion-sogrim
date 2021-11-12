import { Box, Theme, Typography } from "@mui/material";
import React from "react";
import { useAuth } from "../../hooks/useAuth";
import GoogleAuth from "../GoogleAuth/GoogleAuth";

export const BannerAnonymous: React.FC = () => {
  
  return <Box sx={{display: 'flex', flexDirection: 'column', gap: '20px',  alignItems: 'center', textAlign: 'center'}}>
    <Typography variant="h4" sx={sxAppTitle}> 
             {`רוצה לסגור את התואר? צריך להתחבר  🤓`}
    </Typography>
       <GoogleAuth />       
        </Box>
}

const sxAppTitle = {
  color: (theme: Theme) => theme.palette.common.white,    
  fontWeight: 'bold',
}
