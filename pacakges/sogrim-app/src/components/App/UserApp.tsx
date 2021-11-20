import { useMemo, useState, useEffect } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Layout } from '../Layout/Layout';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../hooks/useStore';
import useUserState from '../../hooks/apiHooks/useUserState';
import { useAuth } from '../../hooks/useAuth';
import useCatalogs from '../../hooks/apiHooks/useCatalogs';


const UserAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);  
  
  const { dataStore: {
    setUserState,
    userState
  }} = useStore();

  const { userAuthToken } = useAuth();

  const { data, isLoading, isError} = useUserState(userAuthToken);
  //const { data: catalogsData, isLoading: catalogsIsLoading, isError: catalogsIsError} = useCatalogs(userAuthToken);
  
  useEffect(() => {
      if (isError) {
        // TODO: add error state.
      } else if (data && !isLoading) {        
        setUserState(data);
      }
  }, [data, isLoading,  isError]);

  // TODO: add loading state.
  console.log({...userState});

  const theme = useMemo(() => getAppTheme(mode), [mode]);
  
  return (            
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
      </Layout>
    </ThemeProvider>  
  );
}

export const UserApp = observer(UserAppComp);