import { useQuery } from 'react-query';
import { getComputeEndGame } from '../../services/api';

export default function useComputeEndGame(authToken: any, trigger: boolean) {    
    return useQuery(
    'userState', 
    () => getComputeEndGame(authToken),
    {
        enabled: !!authToken && trigger,
        
    }
    )
}