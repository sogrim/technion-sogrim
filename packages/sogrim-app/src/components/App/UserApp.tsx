import { useEffect, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Layout } from '../Layout/Layout';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { observer } from 'mobx-react-lite';
import { useAuth } from '../../hooks/useAuth';
import useUserState from '../../hooks/apiHooks/useUserState';
import { useStore } from '../../hooks/useStore';

const UserAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);  
  const theme = useMemo(() => getAppTheme(mode), [mode]);
  
  const { userAuthToken } = useAuth();
  const { data, isLoading } = useUserState(userAuthToken);
  
  const { dataStore: {
    initUserDetails,
  }} = useStore();

  useEffect(() => {
  if (!isLoading && data) {
    initUserDetails(data.details);    
  }
},[data, initUserDetails, isLoading]);
  
  return (            
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout />
    </ThemeProvider>  
  );
}

export const UserApp = observer(UserAppComp);