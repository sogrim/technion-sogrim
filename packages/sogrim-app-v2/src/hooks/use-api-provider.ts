import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
import { ApiProvider } from "@/data/api-provider";
import { setProvider, getProvider } from "@/data/course-schedule-provider";
import { useTimetableStore, loadTimetableFromBackend } from "@/stores/timetable-store";

let _apiProvider: ApiProvider | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Hook to initialize the ApiProvider and subscribe to its updates.
 * Returns { ready, error } — components should show a loading state until ready.
 *
 * Also triggers re-renders when the provider fetches new course data,
 * so search results and course details update reactively.
 */
export function useApiProvider(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(_apiProvider !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_apiProvider) {
      setReady(true);
      return;
    }

    if (!_initPromise) {
      const provider = new ApiProvider();
      _initPromise = provider
        .init()
        .then(async () => {
          _apiProvider = provider;
          setProvider(provider);

          // Load saved timetable from backend, then fall back to latest semester
          await loadTimetableFromBackend();
          const state = useTimetableStore.getState();
          if (!state.currentSemester) {
            const semesters = provider.getSemesters();
            if (semesters.length > 0) {
              useTimetableStore.getState().setSemester(semesters[0].id);
            }
          }

          setReady(true);
        })
        .catch((err) => {
          console.error("ApiProvider init failed:", err);
          setError("שגיאה בטעינת נתוני קורסים");
          _initPromise = null;
        });
    } else {
      _initPromise.then(() => setReady(true)).catch(() => {});
    }
  }, []);

  return { ready, error };
}

/**
 * Subscribe to ApiProvider data changes so components re-render
 * when background course fetches complete.
 */
export function useProviderUpdates(): number {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (!_apiProvider) return () => {};
    return _apiProvider.onChange(onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => {
    if (!_apiProvider) return 0;
    // Return cache size as a "version" — changes when new courses load
    return _apiProvider.getAllCourses().filter((c) => c.name !== "").length;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Eagerly fetch a course by ID. Returns the course when loaded.
 */
export function usePrefetchCourse(courseId: string | null) {
  const [course, setCourse] = useState(
    courseId ? getProviderSafe()?.getCourse(courseId) : undefined,
  );

  useEffect(() => {
    if (!courseId || !_apiProvider) return;
    const cached = _apiProvider.getCourse(courseId);
    if (cached && cached.groups.length > 0) {
      setCourse(cached);
      return;
    }
    _apiProvider.prefetch(courseId).then((c) => {
      if (c) setCourse(c);
    });
  }, [courseId]);

  return course;
}

/** Switch the provider to a different semester (by semester ID like "2025-201"). */
export function switchProviderSemester(semesterId: string) {
  if (_apiProvider) {
    _apiProvider.switchSemester(semesterId);
  }
}

/** Check if the provider is currently loading the course index. */
export function isProviderLoading(): boolean {
  return _apiProvider?.isLoading() ?? false;
}

function getProviderSafe() {
  try {
    return getProvider();
  } catch {
    return null;
  }
}
