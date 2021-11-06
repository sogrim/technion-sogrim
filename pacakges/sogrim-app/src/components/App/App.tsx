import { useMemo, useState, useEffect, useContext } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Layout } from '../Layout/Layout';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { useQuery } from 'react-query';
import { AuthContext, useAuth } from '../../hooks/useAuth';

const AppComp: React.FC = () => {
  const [mode, setMode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  
  // const { 
  //     data: catalogs,
  //     isError: isCatalogsError,
  //     isLoading: isCatalogsLoadings, 
  //     error: catalogsError ,
  //   } = useQuery('catalogs', getCatalogs);
  
  return (        
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
      </Layout>
    </ThemeProvider>  
  );
}

export const App = AppComp;
