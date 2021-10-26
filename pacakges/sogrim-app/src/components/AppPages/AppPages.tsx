import { Box } from "@mui/system";
import { PagesTabs } from "./Tabs";

export const AppPages: React.FC = () => {
    return ( 
        <Box sx={sxPages} > 
            <PagesTabs/>
               
        </Box> 
        );
}

const sxPages = {
    width: '100%',
    marginTop: '20px',
    height: 500,    
    display: 'flex',  
    justifyContent: 'center',    
}