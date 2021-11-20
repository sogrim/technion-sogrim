import { useQuery } from 'react-query';
import { getCatalogs } from '../../services/api';

export default function useUserState(authToken: any) {    
    return useQuery(
    'useState', 
    () => getCatalogs(authToken),
    {
        enabled: !!authToken,
    }
    )
}