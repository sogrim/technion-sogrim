import { useMutation, useQueryClient } from 'react-query';
import { putUserCatalog, putUserUgData } from '../../services/api';

export default function useUpdateUserUgData(authToken: any) {
    
    // const queryClinet = useQueryClient();
    return useMutation(
        'userUgData',
        (ugData: string) => putUserUgData(authToken, ugData),             
    )
}