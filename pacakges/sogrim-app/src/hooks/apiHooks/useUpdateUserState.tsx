import { useMutation, MutationCache } from 'react-query';
import { getUserState, postUserState } from '../../services/api';

// export default function useUpdateUserState(authToken: any) {
//   return useMutation(
//     (values) => postUserState(authToken),
//     {
//       onMutate: (newPost) => {
//         const oldPosts = queryCache.getQueryData('useState')

//         if (queryCache.getQueryData('posts')) {
//           queryCache.setQueryData('posts', old => [...old, newPost])
//         }

//         return () => queryCache.setQueryData('posts', oldPosts)
//       },
//       onError: (error, _newPost, rollback) => {
//         console.error(error);
//         if (rollback) rollback()
//       },
//       onSettled: () => {
//         queryCache.invalidateQueries('posts');
//       }
//     }
//   )
// }