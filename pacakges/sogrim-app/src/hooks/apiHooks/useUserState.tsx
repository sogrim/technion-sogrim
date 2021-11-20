import { useQuery } from 'react-query';
import { getUserState } from '../../services/api';

export default function useUserState(authToken: any) {    
    return useQuery(
    'useState', 
    () => getUserState(authToken),
    {
        enabled: !!authToken,
    }
    )
}