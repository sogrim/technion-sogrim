# Sogrim V2 E2E Test Plan

## Test Environment
- Old app: http://localhost:3000 (CRA + MobX + MUI)
- New app: http://localhost:3001 (Vite + TanStack + shadcn)
- Backend: http://localhost:8080 (Rust + Actix + MongoDB)
- Tool: browser-use CLI (headed mode)

## Test Phases

### Phase 1: New App - Basic Loading & Auth
1. Open new app at localhost:3001
2. Verify landing page renders (Hebrew title "סוגרים", RTL layout)
3. Verify Google Sign-In button appears
4. Verify font is "Assistant" (matching old app)
5. Screenshot: landing page

### Phase 2: Old App - Baseline Capture
1. Open old app at localhost:3000
2. Screenshot: landing page
3. Login with Google
4. Screenshot: main page after login
5. Navigate through all pages, screenshot each
6. Note: catalog, semester count, course count, bank requirements

### Phase 3: New App - Full Onboarding Flow
1. Login via Google
2. Step 1: Select catalog (מדעי המחשב 3 שנים)
3. Step 2: Paste UG grade data (from ug_ctrl_c_ctrl_v.txt)
4. Step 3: Wait for compute to complete
5. Verify: planner page loads with courses
6. Screenshot at each step

### Phase 4: New App - Planner Page Functionality
1. Verify semester tabs appear (חורף, אביב for each year)
2. Click through each semester tab
3. Verify course grid loads with correct data
4. Verify columns: course name, number, credits, grade, category, status
5. Verify status badges (הושלם, לא הושלם, בתהליך)
6. Screenshot: multiple semesters

### Phase 5: New App - Course Grid Operations
1. Click edit on a grade cell → change grade → verify state updates
2. Add a new course via the add form:
   - Search for a course name
   - Select from autocomplete
   - Enter grade
   - Select category
   - Submit
3. Verify new course appears in grid
4. Delete a course → verify it disappears
5. Verify backend saves (refresh and check data persists)

### Phase 6: New App - Bank Requirements
1. Verify requirements panel shows on desktop (right side)
2. Check each bank: name, progress bar, credit count
3. Verify completed banks show green badge
4. Verify in-progress banks show yellow
5. Check overflow messages
6. Click "Compute" button → verify status updates

### Phase 7: New App - Settings Page
1. Navigate to /settings
2. Verify profile section shows user info
3. Verify current catalog is displayed
4. Toggle dark mode → verify theme changes
5. Toggle back to light mode

### Phase 8: New App - Navigation
1. Click "מערכת שעות" → verify placeholder page
2. Click "מעקב תואר" → verify planner loads
3. Click "הגדרות" → verify settings page
4. Use browser back/forward → verify routing works

### Phase 9: Comparison - Old vs New
1. Open both apps side by side
2. Compare: same courses, same grades, same bank requirements
3. Compare: visual design quality
4. Compare: page load speed
5. Compare: font rendering

### Phase 10: Responsive / Mobile
1. Resize to mobile viewport (375x812)
2. Verify bottom navigation appears
3. Verify sidebar is hidden
4. Verify course grid is scrollable
5. Verify semester tabs scroll horizontally
6. Open requirements section (expandable on mobile)
7. Navigate between pages
8. Screenshot: each page in mobile view
