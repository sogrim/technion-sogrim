import { Box } from "@mui/system";
import { observer } from "mobx-react-lite";
import React from "react";
import useUserState from "../../hooks/apiHooks/useUserState";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../hooks/useStore";
import { UserRegistrationState } from "../../types/ui-types";
import { AppStepper } from "../Banner/AppStepper";
import { PagesTabs } from "./PagesTabs";

const AppPagesComp: React.FC = () => {

    const { uiStore: {
        userRegistrationState,
    }} = useStore();

    const [ rs, setRs ] = React.useState<UserRegistrationState>();

    const { userAuthToken } = useAuth();
    const { data, isLoading, refetch} = useUserState(userAuthToken);

    React.useEffect(() => {
      const refreshStepper = async() => {
        if (data && !isLoading ) {
          const { data: newData} = await refetch();
          if (newData) {
            const rs = userRegistrationState(newData);            
            setRs(rs);
          }
        }      
      }
      refreshStepper();

    }, [data, isLoading, refetch, setRs, userRegistrationState])

    return ( 
        <Box sx={sxPages} >
            { rs !== UserRegistrationState.Ready ? 
                <AppStepper /> : <PagesTabs/>
            }  
        </Box> 
        );
}

export const AppPages = observer(AppPagesComp);

const sxPages = {
    width: '100%',
    marginTop: '20px',
    height: 500,    
    display: 'flex',  
    justifyContent: 'center',    
}