import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTimetable, putTimetable, type TimetableStateDTO } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useTimetableStore } from "@/stores/timetable-store";
import type { TimetableDraft } from "@/types/timetable";
import type { ApiProvider } from "@/data/api-provider";

// ---------------------------------------------------------------------------
// DTO ↔ Store mapping
// ---------------------------------------------------------------------------

function dtoToDrafts(dto: TimetableStateDTO): TimetableDraft[] {
  return (dto.drafts ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    semester: d.semester,
    courses: (d.courses ?? []).map((c) => ({
      courseId: c.course_id,
      selectedGroups: c.selected_groups ?? {},
    })),
    customEvents: (d.custom_events ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      day: e.day as 0 | 1 | 2 | 3 | 4,
      startTime: e.start_time,
      endTime: e.end_time,
      color: e.color ?? undefined,
    })),
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    isPublished: d.is_published ?? false,
  }));
}

function storeToDto(): TimetableStateDTO {
  const state = useTimetableStore.getState();
  return {
    current_semester: state.currentSemester || null,
    active_draft_id: state.activeDraftId,
    drafts: state.drafts.map((d) => ({
      id: d.id,
      name: d.name,
      semester: d.semester,
      courses: d.courses.map((c) => ({
        course_id: c.courseId,
        selected_groups: c.selectedGroups as Record<string, string>,
      })),
      custom_events: (d.customEvents ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        day: e.day,
        start_time: e.startTime,
        end_time: e.endTime,
        color: e.color ?? null,
      })),
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      is_published: d.isPublished,
    })),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Syncs timetable state between the zustand store and the backend.
 * Uses React Query for fetching (HMR-safe) and debounced mutation for saving.
 *
 * Call this once in the timetable page root.
 */
export function useTimetableSync(provider?: ApiProvider) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // --- Load from backend ---
  const { data, isSuccess } = useQuery({
    queryKey: ["timetable"],
    queryFn: getTimetable,
    enabled: isAuthenticated,
    staleTime: Infinity, // Don't refetch — we own the writes
    refetchOnWindowFocus: false,
  });

  // Hydrate the store ONCE when data first arrives (not on remount)
  useEffect(() => {
    if (!isSuccess || !data) return;
    if (useTimetableStore.getState()._loaded) return; // Already hydrated

    const drafts = dtoToDrafts(data);
    const savedSemester = data.current_semester ?? "";

    if (savedSemester) {
      useTimetableStore.setState({
        currentSemester: savedSemester,
        activeDraftId: data.active_draft_id ?? null,
        drafts,
        _loaded: true,
      });

      // Switch provider to saved semester and prefetch courses
      if (provider) {
        provider.switchSemester(savedSemester).then(() => {
          const courseIds = new Set(drafts.flatMap((d) => d.courses.map((c) => c.courseId)));
          for (const id of courseIds) {
            provider.prefetch(id);
          }
        });
      }
    } else {
      // Fresh user — fall back to latest semester
      if (provider) {
        const semesters = provider.getSemesters();
        if (semesters.length > 0) {
          useTimetableStore.getState().setSemester(semesters[0].id);
        }
      }
      useTimetableStore.setState({ _loaded: true });
    }
  }, [isSuccess, data, provider]);

  // --- Save to backend (debounced) ---
  const mutation = useMutation({
    mutationFn: putTimetable,
    onSuccess: () => {
      useTimetableStore.setState({ _syncing: false, _dirty: false, _lastSaved: Date.now() });
    },
    onError: (err) => {
      console.error("Failed to save timetable:", err);
      useTimetableStore.setState({ _syncing: false });
    },
  });

  const mutationRef = useRef(mutation);
  mutationRef.current = mutation;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to persistent state changes — stable callback via refs
  useEffect(() => {
    const unsub = useTimetableStore.subscribe(
      (s) => [s.currentSemester, s.drafts, s.activeDraftId] as const,
      () => {
        if (!useTimetableStore.getState()._loaded) return;
        useTimetableStore.setState({ _dirty: true });
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          useTimetableStore.setState({ _syncing: true });
          mutationRef.current.mutate(storeToDto());
        }, 500);
      },
      { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
    );
    return () => {
      unsub();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Flush on unload
  useEffect(() => {
    const handleUnload = () => {
      const state = useTimetableStore.getState();
      if (!state._dirty || !state._loaded) return;
      const payload = storeToDto();
      const token = useAuthStore.getState().token ?? "";
      const url = `${import.meta.env.VITE_API_URL || "/api"}/students/timetable`;
      fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", authorization: token },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return {
    isLoading: !isSuccess && isAuthenticated,
    isSaving: mutation.isPending,
  };
}
