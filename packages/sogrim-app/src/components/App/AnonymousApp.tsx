import { useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material';
import { getAppTheme } from '../../themes/theme';
import { DARK_MODE_THEME, LIGHT_MODE_THEME } from '../../themes/constants';
import { observer } from 'mobx-react-lite';
import { BannerAnonymous } from '../Banner/BannerAnonymous';

const AnonymousAppComp: React.FC = () => {
  const [mode] = useState<typeof LIGHT_MODE_THEME | typeof DARK_MODE_THEME>(LIGHT_MODE_THEME);  
  const theme = useMemo(() => getAppTheme(mode), [mode]);
  
  // TODO: add loader
  return (            
    <ThemeProvider theme={theme}>
      <BannerAnonymous />
    </ThemeProvider>  
  );
}

export const AnonymousApp = observer(AnonymousAppComp);
