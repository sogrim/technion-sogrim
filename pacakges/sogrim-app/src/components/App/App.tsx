import { useMemo, useState, useEffect, useContext } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Layout } from '../Layout/Layout';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { useQuery } from 'react-query';

import { useAuth } from '../../hooks/useAuth';
import GoogleAuth from '../GoogleAuth/GoogleAuth';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../hooks/useStore';
import { GoogleClinetSession } from '../../types/auth-types';
import jwtDecode from 'jwt-decode';

const AppComp: React.FC = () => {
  
  const { googleSession, userCredentialResponse, isAuthenticated } = useAuth();

  const { dataStore: {
    userState,
    setUserState,
  }} = useStore();

  useEffect(() => {
    if(googleSession === GoogleClinetSession.DONE) {
      if (userCredentialResponse.credential) {
        setUserState(jwtDecode(userCredentialResponse.credential))
      }      
    }
  }, [googleSession]);

  
  const [mode, setMode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);

  const theme = useMemo(() => getAppTheme(mode), [mode]);
  
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
