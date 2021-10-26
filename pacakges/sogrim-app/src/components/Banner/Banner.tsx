import { Box } from "@mui/system";
import { BannerCards } from "./BannerCards/BannerCards";
import { BannerTitle } from "./BannerTitle";


export const Banner: React.FC = () => {
    return ( <Box sx={sxBanner} > 
                <Box sx={sxInnerBox}> 
                    <BannerTitle />
                    <BannerCards />
                </Box>
            </Box> );
}

const sxBanner = {
    width: '100%',
    height: 300,
    backgroundColor: 'primary.dark',    
    display: 'flex',  
    justifyContent: 'center',    
}

const sxInnerBox = {
    width: '60%',
    height: 250,
    marginTop: '100px',
    display: 'flex',      
    justifyContent: 'space-around'
}