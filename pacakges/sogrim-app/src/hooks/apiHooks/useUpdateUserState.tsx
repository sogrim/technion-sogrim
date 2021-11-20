import { useMutation,useQueryClient } from 'react-query';
import { getUserState, putUserState } from '../../services/api';
import { UserState } from '../../types/data-types';

export default function useUpdateUserState(authToken: any, updatedUserState: UserState) {
    
    // const queryClinet = useQueryClient();

    // return useMutation(
    //     () => putUserState(authToken, updatedUserState),
    //     {
    //     onMutate: (updatedUserState) => {
            
    //     },
    //     onError: (error, _newPost, rollback) => {
    //         console.error(error);
    //         if (rollback) rollback()
    //     },
    //     onSettled: () => {
    //         queryCache.invalidateQueries('posts');
    //     }
    //     }
    // )
}