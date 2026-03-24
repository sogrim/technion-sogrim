import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CourseSelection,
  CustomEvent,
  Day,
  LessonType,
  TimetableDraft,
  TimetableEvent,
  ViewMode,
} from "@/types/timetable";
import { getProvider } from "@/data/course-schedule-provider";
import { generateDraftId, defaultDraftName } from "@/lib/timetable-utils";
import { getConflictingEventKeys, eventKey } from "@/lib/timetable-conflicts";

interface TimetableState {
  // View state
  viewMode: ViewMode;
  selectedDay: Day;
  searchOpen: boolean;

  // Group preview — show all options for a course+type on the grid
  previewingCourse: string | null;
  previewingType: LessonType | null;

  // Course detail modal
  detailCourseId: string | null;

  // Semester & drafts
  currentSemester: string;
  drafts: TimetableDraft[];
  activeDraftId: string | null;

  // Actions: view
  setViewMode: (mode: ViewMode) => void;
  setSelectedDay: (day: Day) => void;
  setSearchOpen: (open: boolean) => void;
  setPreview: (courseId: string | null, type: LessonType | null) => void;
  setDetailCourse: (courseId: string | null) => void;

  // Actions: semester
  setSemester: (semester: string) => void;

  // Actions: draft CRUD
  createDraft: (semester?: string) => string;
  renameDraft: (draftId: string, name: string) => void;
  deleteDraft: (draftId: string) => void;
  setActiveDraft: (draftId: string) => void;

  // Actions: course management
  addCourse: (courseId: string) => void;
  removeCourse: (courseId: string) => void;
  setGroup: (courseId: string, type: LessonType, groupId: string) => void;

  // Actions: custom events
  addCustomEvent: (event: Omit<CustomEvent, "id">) => void;
  updateCustomEvent: (eventId: string, updates: Partial<CustomEvent>) => void;
  removeCustomEvent: (eventId: string) => void;

  // Actions: planner integration
  publishToPlanner: (draftId: string) => void;
}

/** Get or create the active draft, returns updated state slice */
function getActiveDraft(state: TimetableState): TimetableDraft | undefined {
  return state.drafts.find((d) => d.id === state.activeDraftId);
}

function updateDraft(
  drafts: TimetableDraft[],
  draftId: string,
  updater: (draft: TimetableDraft) => Partial<TimetableDraft>,
): TimetableDraft[] {
  return drafts.map((d) =>
    d.id === draftId
      ? { ...d, ...updater(d), updatedAt: new Date().toISOString() }
      : d,
  );
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set, get) => ({
      viewMode: "week",
      selectedDay: 0,
      searchOpen: false,
      previewingCourse: null,
      previewingType: null,
      detailCourseId: null,
      currentSemester: "spring-2026",
      drafts: [],
      activeDraftId: null,

      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedDay: (day) => set({ selectedDay: day }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setPreview: (courseId, type) => set({ previewingCourse: courseId, previewingType: type }),
      setDetailCourse: (courseId) => set({ detailCourseId: courseId }),

      setSemester: (semester) => {
        const state = get();
        // Find first draft for this semester, or create one
        const semesterDrafts = state.drafts.filter(
          (d) => d.semester === semester,
        );
        set({
          currentSemester: semester,
          activeDraftId: semesterDrafts[0]?.id ?? null,
        });
      },

      createDraft: (semester) => {
        const state = get();
        const sem = semester ?? state.currentSemester;
        const semDrafts = state.drafts.filter((d) => d.semester === sem);
        const id = generateDraftId();
        const now = new Date().toISOString();
        const newDraft: TimetableDraft = {
          id,
          name: defaultDraftName(semDrafts.length),
          semester: sem,
          courses: [],
          customEvents: [],
          createdAt: now,
          updatedAt: now,
          isPublished: false,
        };
        set({
          drafts: [...state.drafts, newDraft],
          activeDraftId: id,
        });
        return id;
      },

      renameDraft: (draftId, name) => {
        set({ drafts: updateDraft(get().drafts, draftId, () => ({ name })) });
      },

      deleteDraft: (draftId) => {
        const state = get();
        const remaining = state.drafts.filter((d) => d.id !== draftId);
        const semDrafts = remaining.filter(
          (d) => d.semester === state.currentSemester,
        );
        set({
          drafts: remaining,
          activeDraftId:
            state.activeDraftId === draftId
              ? (semDrafts[0]?.id ?? null)
              : state.activeDraftId,
        });
      },

      setActiveDraft: (draftId) => set({ activeDraftId: draftId }),

      addCourse: (courseId) => {
        const state = get();
        const draft = getActiveDraft(state);
        if (!draft) return;

        // Don't add duplicates
        if (draft.courses.some((c) => c.courseId === courseId)) return;

        // Auto-select first group of each lesson type
        const course = getProvider().getCourse(courseId);
        if (!course) return;

        const selectedGroups: Partial<Record<LessonType, string>> = {};
        const seenTypes = new Set<LessonType>();
        for (const group of course.groups) {
          if (!seenTypes.has(group.type)) {
            seenTypes.add(group.type);
            selectedGroups[group.type] = group.id;
          }
        }

        const selection: CourseSelection = { courseId, selectedGroups };
        set({
          drafts: updateDraft(state.drafts, draft.id, (d) => ({
            courses: [...d.courses, selection],
            isPublished: false,
          })),
        });
      },

      removeCourse: (courseId) => {
        const state = get();
        const draft = getActiveDraft(state);
        if (!draft) return;

        set({
          drafts: updateDraft(state.drafts, draft.id, (d) => ({
            courses: d.courses.filter((c) => c.courseId !== courseId),
            isPublished: false,
          })),
        });
      },

      setGroup: (courseId, type, groupId) => {
        const state = get();
        const draft = getActiveDraft(state);
        if (!draft) return;

        set({
          drafts: updateDraft(state.drafts, draft.id, (d) => ({
            courses: d.courses.map((c) =>
              c.courseId === courseId
                ? {
                    ...c,
                    selectedGroups: { ...c.selectedGroups, [type]: groupId },
                  }
                : c,
            ),
            isPublished: false,
          })),
          // Clear preview after selection
          previewingCourse: null,
          previewingType: null,
        });
      },

      addCustomEvent: (event) => {
        const state = get();
        const draft = getActiveDraft(state);
        if (!draft) return;
        const id = `ce-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        set({
          drafts: updateDraft(state.drafts, draft.id, (d) => ({
            customEvents: [...(d.customEvents ?? []), { ...event, id }],
          })),
        });
      },

      updateCustomEvent: (eventId, updates) => {
        const state = get();
        const draft = getActiveDraft(state);
        if (!draft) return;
        set({
          drafts: updateDraft(state.drafts, draft.id, (d) => ({
            customEvents: (d.customEvents ?? []).map((e) =>
              e.id === eventId ? { ...e, ...updates } : e,
            ),
          })),
        });
      },

      removeCustomEvent: (eventId) => {
        const state = get();
        const draft = getActiveDraft(state);
        if (!draft) return;
        set({
          drafts: updateDraft(state.drafts, draft.id, (d) => ({
            customEvents: (d.customEvents ?? []).filter((e) => e.id !== eventId),
          })),
        });
      },

      publishToPlanner: (draftId) => {
        set({
          drafts: updateDraft(get().drafts, draftId, () => ({
            isPublished: true,
          })),
        });
        // TODO: sync courses to planner via API
      },
    }),
    {
      name: "sogrim-timetable",
    },
  ),
);

/**
 * Resolve current draft's course selections into renderable TimetableEvents.
 * Includes ghost preview events when previewing group alternatives.
 */
export function resolveEvents(
  draft: TimetableDraft | undefined,
  previewingCourse?: string | null,
  previewingType?: LessonType | null,
): TimetableEvent[] {
  if (!draft) return [];

  const provider = getProvider();
  const events: TimetableEvent[] = [];

  draft.courses.forEach((selection, courseIndex) => {
    const course = provider.getCourse(selection.courseId);
    if (!course) return;

    const colorIndex = courseIndex;
    const isPreviewTarget =
      previewingCourse === course.id && previewingType != null;

    // For each selected group, get all its lessons
    for (const [, groupId] of Object.entries(selection.selectedGroups)) {
      const group = course.groups.find((g) => g.id === groupId);
      if (!group) continue;

      for (const lesson of group.lessons) {
        events.push({
          courseId: course.id,
          courseName: course.name,
          type: group.type,
          groupId: group.id,
          day: lesson.day,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          building: lesson.building,
          room: lesson.room,
          instructor: lesson.instructor,
          colorIndex,
          hasConflict: false,
        });
      }
    }

    // Add ghost preview events for ALL alternative groups of the previewing type
    if (isPreviewTarget) {
      const altGroups = course.groups.filter(
        (g) =>
          g.type === previewingType &&
          g.id !== selection.selectedGroups[previewingType!],
      );
      for (const group of altGroups) {
        for (const lesson of group.lessons) {
          events.push({
            courseId: course.id,
            courseName: course.name,
            type: group.type,
            groupId: group.id,
            day: lesson.day,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
            building: lesson.building,
            room: lesson.room,
            instructor: lesson.instructor,
            colorIndex,
            hasConflict: false,
            isPreview: true,
          });
        }
      }
    }
  });

  // Add custom events
  const customEvents = draft.customEvents ?? [];
  const courseCount = draft.courses.length;
  customEvents.forEach((ce, i) => {
    events.push({
      courseId: ce.id,
      courseName: ce.title,
      type: "lecture",
      groupId: "",
      day: ce.day,
      startTime: ce.startTime,
      endTime: ce.endTime,
      colorIndex: courseCount + i,
      hasConflict: false,
      isCustom: true,
      customEventId: ce.id,
      customColor: ce.color,
    });
  });

  // Mark conflicts (only among non-preview events)
  const realEvents = events.filter((e) => !e.isPreview);
  const conflictKeys = getConflictingEventKeys(realEvents);
  return events.map((e) => ({
    ...e,
    hasConflict: e.isPreview ? false : conflictKeys.has(eventKey(e)),
  }));
}
