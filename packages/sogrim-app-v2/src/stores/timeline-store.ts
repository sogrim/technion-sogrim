import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Hoisted state for the planner's semester timeline.
 *
 *  `positions` is the calendar slot of each ordinal-named semester, encoded
 *  as a linear index `year*3 + season` (winter/spring/summer = 0/1/2). It's
 *  parallel to the `ordinals` array passed into the timeline — `positions[i]`
 *  is the calendar slot of `ordinals[i]`. Other surfaces (banner stats,
 *  exports, future analytics) read this to derive academic-year info.
 *
 *  `annotations` keys gap slots (e.g. military service, leave) by their
 *  linear index with a free-form Hebrew label. */
export interface TimelineState {
  positions: number[];
  annotations: Record<number, string>;
}

interface TimelineStore extends TimelineState {
  setState: (state: TimelineState | ((s: TimelineState) => TimelineState)) => void;
  setPositions: (positions: number[]) => void;
  setAnnotations: (annotations: Record<number, string>) => void;
}

/** Convert a linear calendar idx (`year*3 + season`) to an academic year. */
export function yearFromLinearIdx(idx: number): number {
  return Math.floor(idx / 3);
}

/** Distinct academic years across a list of linear calendar positions. */
export function distinctAcademicYears(positions: readonly number[]): number {
  const years = new Set<number>();
  for (const pos of positions) {
    if (typeof pos === "number") years.add(yearFromLinearIdx(pos));
  }
  return years.size;
}

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set) => ({
      positions: [],
      annotations: {},
      setState: (next) =>
        set((s) =>
          typeof next === "function"
            ? next({ positions: s.positions, annotations: s.annotations })
            : next,
        ),
      setPositions: (positions) => set({ positions }),
      setAnnotations: (annotations) => set({ annotations }),
    }),
    {
      // Same localStorage key the timeline used pre-hoist, so existing users
      // keep their saved positions across the upgrade.
      name: "sogrim-timeline-v2",
      // Only the data, not the actions, gets serialized.
      partialize: (s) => ({ positions: s.positions, annotations: s.annotations }),
    },
  ),
);
