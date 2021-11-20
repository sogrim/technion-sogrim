import { useMemo, useState, useEffect } from 'react';
import GoogleAuth from '../GoogleAuth/GoogleAuth';
import { ThemeProvider } from '@mui/material';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../hooks/useStore';
import { useAuth } from '../../hooks/useAuth';
import { UserApp } from './UserApp';
import { AnonymousApp } from './AnonymousApp';
import { GoogleClinetSession } from '../../types/auth-types';
import jwtDecode from 'jwt-decode';


const AppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);  

  const { uiStore: {
    setUserDisplay,
  }} = useStore();
  const { isAuthenticated, googleSession, userAuthToken } = useAuth();

   useEffect(() => {
    if(googleSession === GoogleClinetSession.DONE) {
      if (userAuthToken) {
        setUserDisplay(jwtDecode(userAuthToken))
      }      
    }
  }, [googleSession]);

  const theme = useMemo(() => getAppTheme(mode), [mode]);
  
  return (            
    <ThemeProvider theme={theme}>
      <GoogleAuth />       
      { isAuthenticated ? <UserApp /> : <AnonymousApp/>}
    </ThemeProvider>  
  );
}

export const App = observer(AppComp);
