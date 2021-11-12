import { useMemo, useState, useEffect, useContext } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Layout } from '../Layout/Layout';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { useQuery } from 'react-query';

import { useAuth } from '../../hooks/useAuth';
import GoogleAuth from '../GoogleAuth/GoogleAuth';
import { observer } from 'mobx-react-lite';

const AppComp: React.FC = () => {
  const [mode, setMode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const { googleSession } = useAuth();

  console.log(googleSession);
  
  return (            
    <ThemeProvider theme={theme}>
      <GoogleAuth />       
      <CssBaseline />
      <Layout>
      </Layout>
    </ThemeProvider>  
  );
}

export const App = observer(AppComp);
