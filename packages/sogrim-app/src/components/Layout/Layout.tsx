import { styled, Box } from '@mui/material';
import { Header } from '../Header/Header';
import { Banner } from '../Banner/Banner';

import { FOOTER_HEIGHT } from '../../themes/constants';
import { AppPages } from '../AppPages/AppPages';

export const Layout: React.FC = ({ children }) => {  

  return (
    <LayoutWrapper>
      <ContentWrapper>
        <Box component="header">
          <Header />
        </Box>
        <Banner />                     
      </ContentWrapper>
       <AppPages /> 
      {/* {<Footer />} */}
    </LayoutWrapper>
  );
};

const LayoutWrapper = styled('div')`
  min-height: 100vh;
`;

const ContentWrapper = styled('div')`
  display: flex;
  min-height: calc(30vh - ${FOOTER_HEIGHT}px);
`;