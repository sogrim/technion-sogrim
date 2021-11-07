import { useState } from 'react';
import { styled, Box } from '@mui/material';
import { Header } from '../Header/Header';
import { Footer } from '../Footer';
import { Banner } from '../Banner/Banner';

import { FOOTER_HEIGHT } from '../../themes/constants';
import { AppPages } from '../AppPages/AppPages';

export const Layout: React.FC = ({ children }) => {
  const [open, setOpen] = useState(false);
  const toggleNavigation = () => setOpen((status) => !status);

  return (
    <LayoutWrapper>
      <ContentWrapper>
        <Box component="header">
          <Header toggleNavigation={toggleNavigation} />
        </Box>
        <Banner />             
      </ContentWrapper>
      <AppPages /> 
      <Box component="footer">
        <Footer />
      </Box>
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
