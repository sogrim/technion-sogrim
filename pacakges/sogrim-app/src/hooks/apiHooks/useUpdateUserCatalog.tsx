import { useMutation,useQueryClient } from 'react-query';
import { putUserCatalog } from '../../services/api';
import { UserState } from '../../types/data-types';

export default function useUpdateUserCatalog(authToken: any) {
    
    // const queryClinet = useQueryClient();
    return useMutation(
        'userCatalog',
        (updatedUserCatalog: string) => putUserCatalog(authToken, updatedUserCatalog),             
    )
}