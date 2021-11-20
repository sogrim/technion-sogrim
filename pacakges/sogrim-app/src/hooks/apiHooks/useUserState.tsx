import { useQuery } from 'react-query';
import { getUserState } from '../../services/api';
import { UserState } from '../../types/data-types';
 
export default function useUserState(authToken: any = undefined, trigger: boolean = false) {    
    return useQuery<UserState>(
    'userState', 
    () => getUserState(authToken),
    {
        onSuccess: () => console.log('horay'),
        enabled: !!authToken && trigger,
    

    },    
    )
}