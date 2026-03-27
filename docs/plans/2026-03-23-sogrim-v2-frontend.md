# Sogrim V2 Frontend - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a modern, responsive frontend for the Sogrim degree planner, replacing the legacy MUI/MobX app with shadcn/ui + Tailwind + TanStack + Zustand.

**Architecture:** SPA with Vite, type-safe routing via TanStack Router, server state via TanStack Query, client state via Zustand. RTL-first Hebrew UI with shadcn/ui components. AG Grid Community for course tables. Same backend API.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Router, TanStack Query v5, Zustand, AG Grid Community, React Hook Form + Zod, Motion

---

## Task 1: Scaffold Vite Project

**Files:**
- Create: `packages/sogrim-app-v2/` (entire project scaffold)

**Step 1: Create Vite project**
```bash
cd packages && npm create vite@latest sogrim-app-v2 -- --template react-ts
```

**Step 2: Install core dependencies**
```bash
cd packages/sogrim-app-v2
npm install @tanstack/react-query @tanstack/react-router zustand axios zod react-hook-form @hookform/resolvers jwt-decode
npm install -D @types/node tailwindcss @tailwindcss/vite
```

**Step 3: Configure Vite with Tailwind**
Update `vite.config.ts` to add Tailwind plugin and path aliases.

**Step 4: Configure Tailwind for RTL**
Create `src/index.css` with Tailwind directives and RTL-aware custom properties.

**Step 5: Verify dev server starts**
```bash
npm run dev
```

**Step 6: Commit**

---

## Task 2: Set Up shadcn/ui + RTL Theme

**Files:**
- Create: `components.json` (shadcn config)
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/` (shadcn components)

**Step 1: Initialize shadcn/ui**
```bash
npx shadcn@latest init
```

**Step 2: Add RTL support to HTML**
Set `dir="rtl"` on root html element, configure Tailwind logical properties.

**Step 3: Install base components**
```bash
npx shadcn@latest add button card dialog dropdown-menu input label select tabs toast separator badge progress sheet accordion
```

**Step 4: Create theme with CSS variables**
Light/dark mode with Hebrew-friendly design tokens.

**Step 5: Commit**

---

## Task 3: TypeScript Types (shared with backend)

**Files:**
- Create: `src/types/api.ts` - All API response/request types
- Create: `src/types/domain.ts` - Domain types (CourseState, Grade options, etc.)

Types to define (matching backend exactly):
```typescript
// Enums
Faculty, UserPermissions, CourseState, CourseGradeOptions

// Models
Course, CourseStatus, CourseBankReq, DegreeStatus,
UserDetails, UserSettings, UserState, Catalog,
ComputeDegreeStatusPayload

// UI Types
RowData (for grid display)
```

**Commit**

---

## Task 4: API Layer

**Files:**
- Create: `src/lib/api-client.ts` - Axios instance with auth interceptor
- Create: `src/lib/api.ts` - All API functions

API functions (matching existing backend):
```typescript
getCatalogs(faculty?) → GET /students/catalogs
getCourseByFilter(filterName, filter) → GET /students/courses?{filterName}={filter}
putUserCatalog(catalogId) → PUT /students/catalog
postUserUgData(ugData) → POST /students/courses
getUserState() → GET /students/login
putUserState(details) → PUT /students/details
getComputeEndGame() → GET /students/degree-status
putUserSettings(settings) → PUT /students/settings
```

Auth token injected via Axios interceptor reading from Zustand store.

**Commit**

---

## Task 5: Zustand Stores

**Files:**
- Create: `src/stores/auth-store.ts` - Auth state (token, user info, Google session)
- Create: `src/stores/ui-store.ts` - UI state (theme, errors, current semester)

Auth store:
```typescript
{ token, userInfo, isAuthenticated, setCredential, logout }
```

UI store:
```typescript
{ theme, currentSemesterIdx, errorMsg, setTheme, setCurrentSemester, setError }
```

**Commit**

---

## Task 6: TanStack Query Hooks

**Files:**
- Create: `src/hooks/use-user-state.ts`
- Create: `src/hooks/use-catalogs.ts`
- Create: `src/hooks/use-courses-filter.ts`
- Create: `src/hooks/use-mutations.ts` (all mutations in one file)

Key patterns:
- `useUserState()` - staleTime: Infinity, enabled when authenticated
- `useCatalogs(faculty)` - staleTime: 5min
- `useCoursesFilter(filterName, filter)` - debounced, enabled when filter.length > 0
- Mutations: `useUpdateUserState`, `useUpdateCatalog`, `useComputeDegreeStatus`, `useUpdateSettings`, `useParseUgData`
- All mutations sync cache via queryClient.setQueryData on success

**Commit**

---

## Task 7: TanStack Router Setup

**Files:**
- Create: `src/routes/__root.tsx` - Root layout with nav
- Create: `src/routes/index.tsx` - Redirect to /planner
- Create: `src/routes/planner.tsx` - Degree planner page
- Create: `src/routes/settings.tsx` - Settings page
- Create: `src/routes/timetable.tsx` - Placeholder for future timetable
- Create: `src/routeTree.gen.ts` - Auto-generated route tree

Route structure:
```
/ → redirect to /planner
/planner → Degree planner (semesters + requirements)
/settings → Catalog selection, dark mode
/timetable → Future feature placeholder
```

**Commit**

---

## Task 8: Google Auth Integration

**Files:**
- Create: `src/components/auth/google-auth.tsx` - Google Sign-In button
- Create: `src/components/auth/auth-guard.tsx` - Protected route wrapper
- Create: `src/components/auth/anonymous-page.tsx` - Landing for unauthenticated users

Same GSI (Google Sign-In) integration as existing app:
- Load Google GSI script dynamically
- Handle credential callback → store JWT in Zustand
- Decode JWT for user display info
- Auth guard wraps authenticated routes

**Commit**

---

## Task 9: App Shell & Navigation

**Files:**
- Create: `src/components/layout/app-shell.tsx` - Main layout
- Create: `src/components/layout/sidebar.tsx` - Desktop sidebar nav
- Create: `src/components/layout/mobile-nav.tsx` - Bottom nav for mobile
- Create: `src/components/layout/header.tsx` - Top header with user info

Navigation items:
1. Degree Planner (main)
2. Timetable (placeholder, coming soon badge)
3. Settings

Responsive: sidebar on desktop (md+), bottom sheet nav on mobile.
RTL layout throughout.

**Commit**

---

## Task 10: Settings Page

**Files:**
- Create: `src/components/settings/settings-page.tsx`
- Create: `src/components/settings/catalog-selector.tsx`

Settings page contains:
1. Catalog selection (dropdown of available catalogs for chosen faculty)
2. Dark mode toggle
3. User info display (from JWT)

Catalog selection triggers `putUserCatalog` mutation + cache invalidation.

**Commit**

---

## Task 11: Onboarding Flow (Registration States)

**Files:**
- Create: `src/components/onboarding/onboarding-flow.tsx`
- Create: `src/components/onboarding/catalog-step.tsx`
- Create: `src/components/onboarding/courses-step.tsx`
- Create: `src/components/onboarding/ug-import-step.tsx`

Registration states (from existing app):
0. NoCatalog → Show catalog selection
1. NoCourses → Show UG data import
2. NoComputeValue → Trigger compute
3. Ready → Show planner

Step-by-step wizard for first-time users.

**Commit**

---

## Task 12: Degree Planner Page - Semester Tabs

**Files:**
- Create: `src/components/planner/planner-page.tsx` - Main planner layout
- Create: `src/components/planner/semester-tabs.tsx` - Semester tab navigation
- Create: `src/components/planner/semester-panel.tsx` - Content for each semester

Two-panel layout:
- Left: Semester tabs (expandable/collapsible) with course grids
- Right: Bank requirements summary

On mobile: stacked vertically, requirements as a bottom drawer.

Semester management: Add semester (Winter/Spring/Summer), delete semester.
Hebrew semester names: חורף, אביב, קיץ with incrementing numbers.

**Commit**

---

## Task 13: Course Grid with AG Grid

**Files:**
- Create: `src/components/planner/course-grid.tsx` - AG Grid wrapper
- Create: `src/components/planner/grid-cells/` - Custom cell renderers
- Create: `src/components/planner/add-course-form.tsx` - Add new course

AG Grid Community columns:
| Column | Field | Editable | Renderer |
|--------|-------|----------|----------|
| Course Name | name | Yes (autocomplete) | Text |
| Course # | courseNumber | No (set on add) | Text |
| Credits | credit | Yes | Number |
| Grade | grade | Yes | Custom (numeric or select) |
| Category | type | Yes | Select from bank names |
| Status | state | No (computed) | Badge |
| Actions | - | - | Delete button |

Key behaviors:
- Inline cell editing with validation
- Auto-compute state from grade (>=55 or pass → הושלם)
- Course autocomplete search (debounced API call)
- On any edit: update local state → mutate to backend
- Add course: form with course search, grade, category fields
- Delete course: confirm then remove

**Commit**

---

## Task 14: Course Validation

**Files:**
- Create: `src/lib/course-validator.ts`

Validation rules (from existing CourseValidator):
- courseNumber: exactly 6 or 8 digits
- credit: number >= 0, in 0.5 increments
- grade: 0-100 or special values (עבר, נכשל, פטור ללא ניקוד, פטור עם ניקוד, לא השלים)
- unique courseNumber within semester
- State auto-determination from grade

**Commit**

---

## Task 15: Bank Requirements Display

**Files:**
- Create: `src/components/planner/requirements/requirements-panel.tsx`
- Create: `src/components/planner/requirements/bank-requirement-row.tsx`
- Create: `src/components/planner/requirements/credit-progress.tsx`
- Create: `src/components/planner/requirements/overflow-messages.tsx`

Display for each bank requirement:
- Bank name (חובה, בחירה חופשית, etc.)
- Credit progress bar (completed/required)
- Course count (if applicable)
- Completion badge (green check or remaining count)
- Expandable to show courses in that bank

Overall: total credits, overflow messages, GPA.

**Commit**

---

## Task 16: Compute Degree Status

**Files:**
- Create: `src/components/planner/compute-button.tsx`

"Compute" button triggers GET /students/degree-status:
- Shows loading state
- On success: invalidates userState cache → UI updates
- Display results in requirements panel

**Commit**

---

## Task 17: Dark Mode + Polish

**Files:**
- Modify: Theme CSS variables for dark mode
- Create: `src/components/layout/theme-toggle.tsx`

Tailwind dark mode with class strategy. Toggle in header + settings.
Persist via `putUserSettings` mutation.

**Commit**

---

## Task 18: Mobile Responsive Polish

Test and fix all responsive breakpoints:
- Course grid → scrollable horizontally on small screens, or card view
- Semester tabs → horizontal scroll
- Requirements panel → bottom drawer on mobile
- Navigation → bottom nav bar
- Forms → full-width on mobile

**Commit**

---

## Task 19: Error Handling & Edge Cases

**Files:**
- Create: `src/components/common/error-boundary.tsx`
- Create: `src/components/common/error-toast.tsx`

- Global error boundary with retry
- Toast notifications for validation errors
- Loading skeletons for async data
- Empty states for no courses/semesters

**Commit**

---

## Task 20: Browser-Use E2E Testing

**Setup:**
```bash
pip install browser-use-cli
```

**Test scenarios:**
1. Open both old and new apps side by side
2. Login with Google OAuth
3. Select catalog
4. Import UG data
5. Navigate semesters
6. Add/edit/delete courses
7. Compute degree status
8. Compare results between old and new app
9. Test on mobile viewport

**Commit**

---
