import { useQuery } from 'react-query';
import { getCatalogs } from '../../services/api';

export default function useCatalogs(authToken: any) {    
    return useQuery(
    'catalogs', 
    () => getCatalogs(authToken),
    {
        enabled: !!authToken,
    }
    )
}