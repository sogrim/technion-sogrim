import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
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
import { generateDraftId } from "@/lib/timetable-utils";
import { getConflictingEventKeys, eventKey } from "@/lib/timetable-conflicts";

interface TimetableState {
  // View state (ephemeral — not saved to backend)
  viewMode: ViewMode;
  selectedDay: Day;
  searchOpen: boolean;
  previewingCourse: string | null;
  previewingType: LessonType | null;
  detailCourseId: string | null;

  // Persistent state (saved to backend)
  currentSemester: string;
  drafts: TimetableDraft[];
  activeDraftId: string | null;
  draftCounter: number;

  // Sync status
  _loaded: boolean;   // true only after successful backend load
  _syncing: boolean;
  _lastSaved: number;
  _dirty: boolean;    // true when there are unsaved changes

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
  subscribeWithSelector(
    (set, get) => ({
      viewMode: "week",
      selectedDay: 0,
      searchOpen: false,
      previewingCourse: null,
      previewingType: null,
      detailCourseId: null,
      currentSemester: "",
      drafts: [],
      activeDraftId: null,
      draftCounter: 0,
      _loaded: false,
      _syncing: false,
      _lastSaved: 0,
      _dirty: false,

      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedDay: (day) => set({ selectedDay: day }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setPreview: (courseId, type) => set({ previewingCourse: courseId, previewingType: type }),
      setDetailCourse: (courseId) => set({ detailCourseId: courseId }),

      setSemester: (semester) => {
        const state = get();
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
        const next = state.draftCounter + 1;
        const id = generateDraftId();
        const now = new Date().toISOString();
        const newDraft: TimetableDraft = {
          id,
          name: `אפשרות ${next}`,
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
          draftCounter: next,
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
        if (draft.courses.some((c) => c.courseId === courseId)) return;

        const selection: CourseSelection = { courseId, selectedGroups: {} };
        set({
          drafts: updateDraft(state.drafts, draft.id, (d) => ({
            courses: [...d.courses, selection],
            isPublished: false,
          })),
        });

        getProvider().getCourse(courseId);
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
            courses: d.courses.map((c) => {
              if (c.courseId !== courseId) return c;
              const updated = { ...c.selectedGroups };
              if (groupId) {
                updated[type] = groupId;
              } else {
                delete updated[type];
              }
              return { ...c, selectedGroups: updated };
            }),
            isPublished: false,
          })),
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
    }),
  ),
);


// ---------------------------------------------------------------------------
// Event resolution (unchanged)
// ---------------------------------------------------------------------------

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

    const typeSet = new Set(course.groups.map((g) => g.type));

    for (const type of typeSet) {
      const selectedGroupId = selection.selectedGroups[type];
      const typeGroups = course.groups.filter((g) => g.type === type);

      if (selectedGroupId) {
        const group = typeGroups.find((g) => g.id === selectedGroupId);
        if (!group) continue;
        const kindLabel = `${group.kindLabel} ${group.id.split("-")[0].split("/").map((n) => n.replace(/^0+/, "") || "0").join("/")}`;
        for (const lesson of group.lessons) {
          events.push({
            courseId: course.id,
            courseName: course.name,
            type: group.type,
            kindLabel,
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

        if (isPreviewTarget && previewingType === type) {
          for (const altGroup of typeGroups.filter((g) => g.id !== selectedGroupId)) {
            const altKindLabel = `${altGroup.kindLabel} ${altGroup.id.split("-")[0].split("/").map((n) => n.replace(/^0+/, "") || "0").join("/")}`;
            for (const lesson of altGroup.lessons) {
              events.push({
                courseId: course.id,
                courseName: course.name,
                type: altGroup.type,
                kindLabel: altKindLabel,
                groupId: altGroup.id,
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
      } else {
        for (const group of typeGroups) {
          const kindLabel = `${group.kindLabel} ${group.id.split("-")[0].split("/").map((n) => n.replace(/^0+/, "") || "0").join("/")}`;
          for (const lesson of group.lessons) {
            events.push({
              courseId: course.id,
              courseName: course.name,
              type: group.type,
              kindLabel,
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
    }
  });

  const customEvents = draft.customEvents ?? [];
  const courseCount = draft.courses.length;
  customEvents.forEach((ce, i) => {
    events.push({
      courseId: ce.id,
      courseName: ce.title,
      type: "lecture",
      kindLabel: "",
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

  const realEvents = events.filter((e) => !e.isPreview);
  const conflictKeys = getConflictingEventKeys(realEvents);
  return events.map((e) => ({
    ...e,
    hasConflict: e.isPreview ? false : conflictKeys.has(eventKey(e)),
  }));
}
