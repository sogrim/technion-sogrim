import { useMutation, useQueryClient } from 'react-query';
import { putUserState } from '../../services/api';
import { UserDetails } from '../../types/data-types';

export default function useUpdateUserState(authToken: any) {    
    const queryClient =  useQueryClient();
    
    return useMutation(
        'userState', // The caching key
        (updatedUserState: UserDetails) => putUserState(authToken, updatedUserState), {
            onMutate: (newData: UserDetails) => {
                // Optemsitc update:
                queryClient.cancelQueries('userState');
                const oldData = queryClient.getQueryData<UserDetails>('userState');

                if (oldData) {
                    queryClient.setQueryData('userState', () => {                        
                        let current: UserDetails = newData;
                        current.modified = true;                        
                        return current;
                    })
                }

                return () => queryClient.setQueryData('userState', oldData)
            },

            onError: (error, _newPost, rollback: any) => {
                console.error(error);
                if (rollback) {
                    rollback();
                }         
            },

            onSettled: () => {
                queryClient.invalidateQueries('userState');
            },

        },         
    )
}