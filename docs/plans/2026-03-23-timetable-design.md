# Timetable Feature — Design Document

**Date:** 2026-03-23
**Status:** Approved (user confirmed all key decisions)

## Overview

A weekly schedule builder for Technion students, integrated into sogrim-app-v2. Students search courses, build timetable drafts per semester, compare options, and publish to the degree planner.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Grid rendering | Pure CSS Grid | Zero deps, full control, fits Tailwind/shadcn stack |
| Mobile views | Day view + compact week view | Two toggleable views, both useful |
| Draft model | Draft-first, persisted server-side per semester | Students experiment freely, publish when ready |
| Data source (POC) | Transformed course schedule data, bundled as static JSON | Clean facade for future API swap |
| Course colors | OKLCH palette, 10 preset hues, dark/light aware | Deterministic by course index, pretty |
| Search UX | shadcn Command (cmdk) palette | Consistent with modern UX, fast keyboard nav |

## Data Model

### Core Types

```typescript
// Day of week (Sunday=0 through Thursday=4)
type Day = 0 | 1 | 2 | 3 | 4;

// Lesson types
type LessonType = "lecture" | "tutorial" | "lab" | "seminar";

interface Lesson {
  day: Day;
  startTime: string;    // "08:30"
  endTime: string;      // "10:30"
  building?: string;
  room?: string;
  instructor?: string;
}

interface LessonGroup {
  id: string;           // e.g. "11", "12"
  type: LessonType;
  lessons: Lesson[];
}

interface CourseSchedule {
  id: string;           // Course number "234114"
  name: string;         // "מבוא למדעי המחשב"
  credit: number;
  faculty?: string;
  examA?: string;       // "2026-02-15 09:00-12:00"
  examB?: string;
  groups: LessonGroup[];
}

interface CourseSelection {
  courseId: string;
  selectedGroups: Record<LessonType, string>; // type -> groupId
}

interface TimetableDraft {
  id: string;
  name: string;         // "אפשרות א׳"
  semester: string;     // "אביב_1"
  courses: CourseSelection[];
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

// What gets rendered on the grid
interface TimetableEvent {
  courseId: string;
  courseName: string;
  type: LessonType;
  groupId: string;
  day: Day;
  startTime: string;
  endTime: string;
  building?: string;
  room?: string;
  instructor?: string;
  colorIndex: number;
  hasConflict: boolean;
}
```

### Data Provider Facade

```typescript
interface TimetableDataProvider {
  searchCourses(query: string): CourseSchedule[];
  getCourse(courseId: string): CourseSchedule | undefined;
  getAllCourses(): CourseSchedule[];
  getSemesters(): string[];
}
```

POC: `StaticDataProvider` loads bundled JSON.
Future: `ApiDataProvider` calls REST endpoints.

## State Management (Zustand)

```typescript
interface TimetableStore {
  // View state
  viewMode: "week" | "day";
  selectedDay: Day;

  // Semester & drafts
  currentSemester: string;
  drafts: TimetableDraft[];
  activeDraftId: string | null;

  // Search
  searchOpen: boolean;

  // Actions
  setViewMode(mode: "week" | "day"): void;
  setSelectedDay(day: Day): void;
  setSemester(semester: string): void;

  // Draft CRUD
  createDraft(semester: string, name?: string): void;
  renameDraft(draftId: string, name: string): void;
  deleteDraft(draftId: string): void;
  setActiveDraft(draftId: string): void;

  // Course management
  addCourse(courseId: string): void;
  removeCourse(courseId: string): void;
  setGroup(courseId: string, type: LessonType, groupId: string): void;

  // Planner integration
  publishToPlanner(draftId: string): void;
}
```

Store is persisted to localStorage AND will sync to server API when ready.

## Component Architecture

```
TimetablePage (orchestrator)
├── TimetableToolbar
│   ├── SemesterSelector (dropdown)
│   ├── DraftTabs (pill tabs: "אפשרות א׳", "אפשרות ב׳", +)
│   ├── ViewToggle (day/week, mobile only)
│   └── AddCourseButton → opens CourseSearch
├── TimetableGrid (conditional render)
│   ├── WeekGrid (desktop + compact mobile week)
│   │   ├── TimeColumn (08:00-20:00 labels)
│   │   ├── DayColumn × 5 (Sun-Thu)
│   │   │   └── CourseBlock × N (positioned absolutely)
│   │   └── NowIndicator (current time line)
│   └── DayView (single day, mobile)
│       ├── DayPills (א׳ ב׳ ג׳ ד׳ ה׳)
│       └── DayColumn (full width, same CourseBlock)
├── CourseSearch (cmdk dialog)
│   ├── Search input
│   └── Course results with preview
├── SelectedCoursesPanel (bottom sheet on mobile, sidebar on desktop)
│   ├── CourseCard × N
│   │   ├── Course name + color dot
│   │   ├── GroupSelector per lesson type
│   │   └── RemoveButton
│   └── ConflictWarnings
└── EmptyState (when no courses selected)
```

## CSS Grid Layout

### Week Grid (Desktop)
```
grid-template-columns: 60px repeat(5, 1fr)  /* time + 5 days */
grid-template-rows: 40px repeat(N, 1fr)     /* header + time slots */
```

Each 30-minute slot = 1 row unit. Course blocks span multiple rows based on duration.
Course blocks are absolutely positioned within their day column cell.

### Week Grid (Mobile Compact)
Same grid, narrower columns. Text truncated, smaller font.
```
grid-template-columns: 40px repeat(5, 1fr)
font-size: 0.65rem
```

### Day View (Mobile)
Single column, full width. Day pills at top for switching.

## Color System

10 OKLCH-based course colors, designed for both light and dark modes:

| Index | Light Mode | Dark Mode | Name |
|-------|-----------|-----------|------|
| 0 | oklch(0.75 0.15 250) | oklch(0.55 0.15 250) | Blue |
| 1 | oklch(0.75 0.15 300) | oklch(0.55 0.15 300) | Purple |
| 2 | oklch(0.80 0.15 170) | oklch(0.55 0.12 170) | Teal |
| 3 | oklch(0.80 0.15 55) | oklch(0.60 0.15 55) | Orange |
| 4 | oklch(0.75 0.15 350) | oklch(0.55 0.15 350) | Pink |
| 5 | oklch(0.80 0.15 145) | oklch(0.55 0.15 145) | Green |
| 6 | oklch(0.80 0.15 85) | oklch(0.60 0.15 85) | Amber |
| 7 | oklch(0.70 0.15 275) | oklch(0.50 0.15 275) | Indigo |
| 8 | oklch(0.75 0.18 15) | oklch(0.55 0.15 15) | Rose |
| 9 | oklch(0.80 0.12 200) | oklch(0.55 0.12 200) | Cyan |

Foreground text is always white/dark calculated for contrast.

## Conflict Detection

Two events conflict when:
- Same day
- Time ranges overlap: `startA < endB && startB < endA`

Display: conflicting CourseBlocks get a dashed red border + warning icon.
A conflict badge appears in the toolbar: "⚠ 2 התנגשויות"

## Planner Integration

When "Save to Planner" is clicked:
1. Extract course list from active draft
2. For each course, create/update a `CourseStatus` in the planner's semester
3. Set state to "בתהליך" (in progress)
4. Mark draft as `isPublished: true`

This is one-way for the POC. Planner changes don't back-propagate to timetable.

## Mobile UX

- **Default view on mobile**: Day view
- **Toggle button**: switches between day/compact-week
- **Course search**: full-screen dialog on mobile
- **Selected courses**: bottom sheet (swipe up to see)
- **Swipe gestures** (future): swipe left/right to change day in day-view

## Empty State

When no courses are selected, show:
- Illustration/icon
- "הוסיפו קורסים כדי להתחיל לבנות מערכת"
- Prominent "הוסף קורס" button that opens search

## File Structure

```
src/
  components/timetable/
    timetable-page.tsx
    timetable-toolbar.tsx
    week-grid.tsx
    day-view.tsx
    course-block.tsx
    course-search.tsx
    selected-courses-panel.tsx
    draft-tabs.tsx
    empty-state.tsx
    conflict-badge.tsx
    semester-selector.tsx
    view-toggle.tsx
    group-selector.tsx
  stores/
    timetable-store.ts
  types/
    timetable.ts
  lib/
    timetable-colors.ts
    timetable-conflicts.ts
    timetable-utils.ts
  data/
    course-schedule-provider.ts
    static-provider.ts
    courses/
      spring-2026.json
```
