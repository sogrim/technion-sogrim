import type { ResourceRecord } from "@/types/bo";

/**
 * Representative fixtures (shapes lifted from packages/docs) used by mock mode
 * (`VITE_USE_MOCKS=true`) so the UI runs with no backend and no login.
 */

export const MOCK_CATALOGS: ResourceRecord[] = [
  {
    _id: { $oid: "6192e5f4d6c89bbe5647f8db" },
    name: "מדמח תלת שנתי 2024-2025",
    faculty: "ComputerScience",
    total_credit: 118.5,
    description: "תוכנית לימודים במסלול כללי",
    course_banks: [
      { name: "חובה", rule: "All", credit: 73.5 },
      { name: "רשימה א'", rule: "AccumulateCredit", credit: 8 },
      { name: "פרויקט", rule: { AccumulateCourses: { $numberLong: "1" } }, credit: null },
      { name: "מל\"ג", rule: "Malag", credit: 6 },
    ],
    credit_overflows: [{ from: "חובה", to: "רשימה ב'" }],
    course_to_bank: {
      "02340125": "חובה",
      "02340114": "חובה",
      "02360203": "רשימה א'",
    },
    catalog_replacements: { "01040134": ["01040158"] },
    common_replacements: { "01040031": ["01040195"] },
  },
  {
    _id: { $oid: "61a102bb04c5400b98e6f401" },
    name: "מדמח תלת שנתי 2019-2020",
    faculty: "ComputerScience",
    total_credit: 118,
    description: "",
    course_banks: [
      { name: "חובה", rule: "All", credit: 70 },
      { name: "בחירה חופשית", rule: "Elective", credit: 6 },
    ],
    credit_overflows: [],
    course_to_bank: { "02340125": "חובה" },
    catalog_replacements: {},
    common_replacements: {},
  },
  {
    _id: { $oid: "62b9f1a04c5400b98e6f777" },
    name: "מדע הנתונים וההחלטות 2023-2024",
    faculty: "DataAndDecisionScience",
    total_credit: 124.5,
    description: "תוכנית מדע הנתונים",
    course_banks: [{ name: "חובה", rule: "All", credit: 90 }],
    credit_overflows: [],
    course_to_bank: {},
    catalog_replacements: {},
    common_replacements: {},
  },
];

export const MOCK_COURSES: ResourceRecord[] = [
  { _id: "02340125", credit: 5.5, name: "אינפי 1מ'", tags: null },
  { _id: "02340114", credit: 3, name: "מבוא למדעי המחשב מ'", tags: null },
  { _id: "03240033", credit: 3, name: "אנגלית מתקדמים ב'", tags: ["English"] },
  { _id: "03940802", credit: 1, name: "התעמלות", tags: ["Sport"] },
  { _id: "02360203", credit: 3.5, name: "מבני נתונים 1", tags: null },
];

export const MOCK_USERS: ResourceRecord[] = [
  {
    sub: "11112222333344445555",
    permissions: "Owner",
    catalog_name: "מדמח תלת שנתי 2024-2025",
    total_credit: 76.5,
    num_courses: 21,
    last_seen: { $date: "2026-06-10T08:30:00Z" },
  },
  {
    sub: "99998888777766665555",
    permissions: "Admin",
    catalog_name: null,
    total_credit: 0,
    num_courses: 0,
    last_seen: null,
  },
  {
    sub: "12345678901234567890",
    permissions: "Student",
    catalog_name: "מדמח תלת שנתי 2019-2020",
    total_credit: 118,
    num_courses: 40,
    last_seen: { $date: "2025-12-01T12:00:00Z" },
  },
];

export const MOCK_USERS_FULL: Record<string, ResourceRecord> = {
  "11112222333344445555": {
    _id: "11112222333344445555",
    permissions: "Owner",
    details: {
      catalog: {
        _id: { $oid: "6192e5f4d6c89bbe5647f8db" },
        name: "מדמח תלת שנתי 2024-2025",
        faculty: "ComputerScience",
        total_credit: 118.5,
        course_bank_names: ["חובה", "רשימה א'", "פרויקט"],
        year: 2024,
      },
      degree_status: {
        total_credit: 76.5,
        course_statuses: [
          { course: { _id: "02340125", name: "אינפי 1מ'", credit: 5.5 }, state: "הושלם", grade: 95 },
        ],
        course_bank_requirements: [
          { course_bank_name: "חובה", credit_requirement: 73.5, credit_completed: 40, completed: false },
        ],
        overflow_msgs: ["2.5 נק\"ז עובר משרשרת מדעית לרשימה ב'"],
      },
      compute_in_progress: false,
      modified: true,
    },
    settings: { dark_mode: false, palette: "sogrim" },
    timetable: { current_semester: null, active_draft_id: null, drafts: [] },
    last_seen: { $date: "2026-06-10T08:30:00Z" },
  },
};

export const MOCK_LISTS: Record<string, ResourceRecord[]> = {
  catalogs: MOCK_CATALOGS,
  courses: MOCK_COURSES,
  users: MOCK_USERS,
};
