import { useMemo, useState, useEffect } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Layout } from '../Layout/Layout';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../hooks/useStore';
import useUserState from '../../hooks/apiHooks/useUserState';
import { useAuth } from '../../hooks/useAuth';

const UserAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);  
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const [ triggerUseUserState, setTriggerUseUserState] = useState<boolean>(true);

  const { userAuthToken } = useAuth();

  const { data, isLoading, isError} = useUserState(userAuthToken, triggerUseUserState);
  
  useEffect(() => {
      if (isError) {
        // TODO: add error state.
      } else if (data && !isLoading) {        
        setTriggerUseUserState(false);        
      }
  }, [data, isLoading, isError]);

  // TODO: add loading state.
  
  return (            
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout />
    </ThemeProvider>  
  );
}

export const UserApp = observer(UserAppComp);