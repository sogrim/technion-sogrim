import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  putUserState,
  putUserCatalog,
  getComputeEndGame,
  putUserSettings,
  postUserUgData,
} from "@/lib/api";
import type { UserDetails, UserSettings, UserState } from "@/types/api";

export function useUpdateUserState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (details: UserDetails) => putUserState(details),
    onMutate: (details) => {
      // Optimistically update the cached userState with the new details
      const previous = queryClient.getQueryData<UserState>(["userState"]);
      if (previous) {
        queryClient.setQueryData<UserState>(["userState"], {
          ...previous,
          details,
        });
      }
      return { previous };
    },
    onError: (_err, _details, context) => {
      // Revert to previous state on error
      if (context?.previous) {
        queryClient.setQueryData(["userState"], context.previous);
      }
    },
  });
}

export function useUpdateCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (catalogId: string) => putUserCatalog(catalogId),
    onSuccess: (data) => {
      queryClient.setQueryData(["userState"], data);
    },
  });
}

export function useComputeDegreeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getComputeEndGame(),
    onSuccess: (data) => {
      queryClient.setQueryData(["userState"], data);
    },
  });
}

// Toggling "include in-progress courses" persists the flag and then runs the
// server-side degree computation, which reads the freshly-persisted flag and
// folds in-progress courses into the totals (and clears `modified`). This makes
// the toggle a single, self-persisting action — no separate "close degree" click
// is needed, and the result survives a page refresh.
export function useSetComputeInProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: UserDetails) => {
      await putUserState(details);
      return getComputeEndGame();
    },
    onMutate: async (details) => {
      await queryClient.cancelQueries({ queryKey: ["userState"] });
      const previous = queryClient.getQueryData<UserState>(["userState"]);
      if (previous) {
        // Flip the toggle optimistically so the switch responds instantly; the
        // real, in-progress-aware totals arrive when the computation resolves.
        queryClient.setQueryData<UserState>(["userState"], {
          ...previous,
          details: {
            ...previous.details,
            compute_in_progress: details.compute_in_progress,
          },
        });
      }
      return { previous };
    },
    onError: (_err, _details, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["userState"], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["userState"], data);
    },
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (settings: UserSettings) => putUserSettings(settings),
  });
}

export function useImportUgData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ugData: string) => postUserUgData(ugData),
    onSuccess: (data) => {
      queryClient.setQueryData(["userState"], data);
    },
  });
}
