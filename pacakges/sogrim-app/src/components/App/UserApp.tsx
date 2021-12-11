import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Layout } from '../Layout/Layout';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { observer } from 'mobx-react-lite';

const UserAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);  
  const theme = useMemo(() => getAppTheme(mode), [mode]);    
    
  return (            
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout />
    </ThemeProvider>  
  );
}

export const UserApp = observer(UserAppComp);