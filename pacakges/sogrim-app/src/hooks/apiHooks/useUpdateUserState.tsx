import { useMutation,useQueryClient } from 'react-query';
import { putUserState } from '../../services/api';
import { UserState } from '../../types/data-types';

export default function useUpdateUserState(authToken: any) {
    // const queryClinet = useQueryClient();
    // TODO: caching & optemistic updates.
    
    return useMutation(
        'userState',
        (updatedUserState: UserState) => putUserState(authToken, updatedUserState),             
    )
}