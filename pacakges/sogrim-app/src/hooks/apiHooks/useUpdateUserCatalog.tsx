import { useMutation,useQueryClient } from 'react-query';
import { putUserCatalog } from '../../services/api';

export default function useUpdateUserCatalog(authToken: any) {    
    // const queryClinet = useQueryClient();
    
    return useMutation(
        'userCatalog',
        (updatedUserCatalog: string) => putUserCatalog(authToken, updatedUserCatalog),             
    )
}