import type { CourseSchedule } from "@/types/timetable";

export const courseSchedules: CourseSchedule[] = [
  {
    id: "00440098",
    name: "מבוא להנדסת חשמל לתעופה וחלל",
    credit: 4,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-05",
    examB: "2026-08-25",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "15:30", building: "אולמן", room: "803", instructor: "מר אליעזר אפלבוים" },
        ] },
      { id: "10", type: "tutorial", lessons: [
          { day: 0, startTime: "18:30", endTime: "19:30", building: "ליידי דייוס - אווירונוטיקה", room: "282", instructor: "מר אלברט אמג'ד שחאדה" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "17:30", endTime: "18:30", building: "ליידי דייוס - אווירונוטיקה", room: "282", instructor: "מר רום בן אדוה" },
        ] },
      { id: "11", type: "lab", lessons: [
          { day: 0, startTime: "09:30", endTime: "13:30" },
        ] },
      { id: "12", type: "lab", lessons: [
          { day: 1, startTime: "14:30", endTime: "18:30" },
        ] },
      { id: "13", type: "lab", lessons: [
          { day: 3, startTime: "14:30", endTime: "18:30" },
        ] },
    ],
  },
  {
    id: "00440101",
    name: "מבוא למערכות תכנה",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-05",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "507", instructor: "מר פבל ליפשיץ" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "11:30", endTime: "12:30", building: "פישבך-חשמל", room: "506", instructor: "מר ויסאם היג'א, מר שקד יצחק" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "פישבך-חשמל", room: "506", instructor: "מר ג'ימי ביטאר" },
        ] },
    ],
  },
  {
    id: "00440105",
    name: "תורת המעגלים החשמליים",
    credit: 4,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-20",
    examB: "2026-08-21",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "13:30", building: "פישבך-חשמל", room: "507", instructor: "ד\"ר ינון סתיו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "404", instructor: "גב' נופר תובל, מר נעם מאיר שחר, מר נג'אח כמאל" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "505", instructor: "פיראס רמדאן" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "פישבך-חשמל", room: "404", instructor: "מר רועי שטיינברג" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "505", instructor: "מר איתי לב-רן" },
        ] },
      { id: "15", type: "tutorial", lessons: [
          { day: 0, startTime: "15:30", endTime: "17:30", building: "פישבך-חשמל", room: "404", instructor: "גב' דימא עלי סאלח" },
        ] },
    ],
  },
  {
    id: "00440114",
    name: "מתמטיקה דיסקרטית ח'",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-26",
    examB: "2026-08-24",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "פרופ' עדית קידר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "גב' שרון גולדשטין" },
        ] },
    ],
  },
  {
    id: "00440124",
    name: "אלקטרוניקה פיסיקלית",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-20",
    examB: "2026-08-19",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "507", instructor: "ד\"ר יובל יעיש" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "403", instructor: "מר באסל גדבאן" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "עמית קטלן" },
        ] },
    ],
  },
  {
    id: "00440127",
    name: "יסודות התקני מוליכים למחצה",
    credit: 3.5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-30",
    examB: "2026-09-01",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "פרופ\"ח אלכסנדר חייט" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "פרופ\"ח ליאור קורנבלום" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "פישבך-חשמל", room: "507", instructor: "מר איתן קמינסקי, מר אהרון גרשון" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "17:30", endTime: "18:30", building: "פישבך-חשמל", room: "403", instructor: "גב' נופר תובל" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "09:30", building: "פישבך-חשמל", room: "506", instructor: "גב' סימה בוכבינדר" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 2, startTime: "17:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר ניקיטה גברילוב" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 3, startTime: "08:30", endTime: "09:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר אלברט אמג'ד שחאדה" },
        ] },
    ],
  },
  {
    id: "00440131",
    name: "אותות ומערכות",
    credit: 5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-13",
    examB: "2026-08-13",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "280", instructor: "ד\"ר גל בן-דוד" },
          { day: 0, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "280", instructor: "ד\"ר גל בן-דוד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "503", instructor: "דביר מארש, אליה חי אמיתי" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "פישבך-חשמל", room: "507", instructor: "מר איתי אוסירוף" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "פישבך-חשמל", room: "507", instructor: "מר עבד אללטיף קאדרי" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "804", instructor: "מר אדם סוקר" },
        ] },
      { id: "15", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "פישבך-חשמל", room: "505", instructor: "דביר מארש" },
        ] },
      { id: "16", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "505", instructor: "אליה חי אמיתי" },
        ] },
    ],
  },
  {
    id: "00440137",
    name: "מעגלים אלקטרוניים",
    credit: 5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-26",
    examB: "2026-08-24",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "ד\"ר ניקולס ויינשטיין" },
          { day: 0, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "ד\"ר ניקולס ויינשטיין" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "ד\"ר אלכסיי דיסקין" },
          { day: 1, startTime: "16:30", endTime: "18:30", building: "פישבך-חשמל", room: "504", instructor: "ד\"ר אלכסיי דיסקין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "403", instructor: "מר יאן זלצר" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "פישבך-חשמל", room: "403", instructor: "מר יואב חכמוביץ" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "504", instructor: "חנין אשקר" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "404", instructor: "חנין אשקר" },
        ] },
    ],
  },
  {
    id: "00440140",
    name: "שדות אלקטרומגנטיים",
    credit: 3.5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-19",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "507", instructor: "פרופ' אבינעם צדוק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "504", instructor: "מר תום דובלקייב, מר יבגני למישצ'וק" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "504", instructor: "מר אורי יחזקאל" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "205", instructor: "ליאור פרידמן" },
        ] },
    ],
  },
  {
    id: "00440148",
    name: "גלים ומערכות מפולגות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-13",
    examB: "2026-08-12",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "פישבך-חשמל", room: "507", instructor: "ד\"ר פבל סידורנקו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "09:30", endTime: "10:30", building: "פישבך-חשמל", room: "403", instructor: "מר גיא סאיר, מר רועי שפרן" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "15:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר מתן אילוז" },
        ] },
    ],
  },
  {
    id: "00440157",
    name: "מעבדה בהנדסת חשמל 1א",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "11", type: "lab", lessons: [
          { day: 0, startTime: "09:30", endTime: "13:30", instructor: "מר דוד בר-און" },
        ] },
      { id: "12", type: "lab", lessons: [
          { day: 1, startTime: "14:30", endTime: "18:30", instructor: "מר דוד בר-און" },
        ] },
      { id: "13", type: "lab", lessons: [
          { day: 3, startTime: "08:30", endTime: "12:30", instructor: "מר דוד בר-און" },
        ] },
      { id: "14", type: "lab", lessons: [
          { day: 3, startTime: "14:30", endTime: "18:30", instructor: "מר דוד בר-און" },
        ] },
    ],
  },
  {
    id: "00440158",
    name: "מעבדה בהנדסת חשמל 1ב",
    credit: 1.5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "11", type: "lab", lessons: [
          { day: 1, startTime: "08:30", endTime: "12:30", instructor: "מר דוד בר-און" },
        ] },
      { id: "12", type: "lab", lessons: [
          { day: 2, startTime: "14:30", endTime: "18:30", instructor: "מר דוד בר-און" },
        ] },
    ],
  },
  {
    id: "00440167",
    name: "פרוייקט א'",
    credit: 4,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "280", instructor: "מר יוחנן ארז" },
        ] },
    ],
  },
  {
    id: "00440191",
    name: "מערכות בקרה 1",
    credit: 4,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-19",
    examB: "2026-08-13",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "פישבך-חשמל", room: "504", instructor: "ד\"ר מרינה אלתרמן" },
          { day: 2, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "504", instructor: "ד\"ר מרינה אלתרמן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "15:30", endTime: "16:30", building: "פישבך-חשמל", room: "504", instructor: "מר חוסין ריאן" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "09:30", building: "פישבך-חשמל", room: "404", instructor: "מר עפרי אייזן, מר חוסין ריאן" },
        ] },
    ],
  },
  {
    id: "00440198",
    name: "מבוא לעבוד ספרתי של אותות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-22",
    examB: "2026-08-17",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "507", instructor: "פרופ' רונן טלמון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "11:30", endTime: "12:30", building: "פישבך-חשמל", room: "404", instructor: "מר יובל גינזברג" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "מר רון מויסייב" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "מר יובל גינזברג" },
        ] },
    ],
  },
  {
    id: "00440202",
    name: "אותות אקראיים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-03",
    examB: "2026-08-27",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "פרופ' תומר מיכאלי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "פישבך-חשמל", room: "504", instructor: "גב' אורי פישלר, גב' איגי שגב גל" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "11:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "מר עפרי אייזן, גב' איגי שגב גל" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "08:30", endTime: "09:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "גב' איגי שגב גל, מר ישי בריטברד" },
        ] },
    ],
  },
  {
    id: "00440239",
    name: "תהליכים במיקרואלקטרוניקה",
    credit: 3.5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-22",
    examB: "2026-08-19",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "15:30", endTime: "17:30", building: "ננו-אלקטרוניקה", room: "465", instructor: "פרופ' ניר טסלר" },
        ] },
    ],
  },
  {
    id: "00440252",
    name: "מערכות ספרתיות ומבנה המחשב",
    credit: 5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-06",
    examB: "2026-08-31",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "280", instructor: "ד\"ר רוסטיסלב דובקין" },
          { day: 0, startTime: "16:30", endTime: "18:30", building: "סגו", room: "1", instructor: "ד\"ר רוסטיסלב דובקין" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 2, startTime: "15:30", endTime: "19:30", building: "הנד' חשמל בלה מאייר", room: "280", instructor: "ד\"ר ניר קציר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "707", instructor: "מר האשם נעייראת, מר מיכאל פלדמן, מר דור מלכה, מר יאיר דרדיק" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "801", instructor: "גב' רוני גרטמן" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "801", instructor: "מר גלאל אבו אחמד ואוי, עמית קטלן" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "805", instructor: "מר תומר קריחלי" },
        ] },
      { id: "15", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "805", instructor: "הילה ברקן" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "707", instructor: "מר בן חנוכה" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 1, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "801", instructor: "מר בן חנוכה" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "805", instructor: "גב' אסיל בדראן" },
        ] },
      { id: "24", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "504", instructor: "מר עילי מנחם" },
        ] },
      { id: "25", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "707", instructor: "מר גלאל אבו אחמד ואוי" },
        ] },
    ],
  },
  {
    id: "00440268",
    name: "מבוא למבני נתונים ואלגוריתמים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-29",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "פישבך-חשמל", room: "504", instructor: "ד\"ר שרי שינולד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "13:30", endTime: "14:30", building: "פישבך-חשמל", room: "505", instructor: "מר רועי שטיינברג" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "15:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר רועי רשף" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "15:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "מר גיא קדרון" },
        ] },
    ],
  },
  {
    id: "00440334",
    name: "רשתות מחשבים ואינטרנט 1",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-15",
    examB: "2026-08-20",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "ד\"ר טל מזרחי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "15:30", building: "פישבך-חשמל", room: "506", instructor: "עילי יבלוביץ" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "פישבך-חשמל", room: "507", instructor: "עילי יבלוביץ" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "09:30", building: "פישבך-חשמל", room: "403" },
        ] },
    ],
  },
  {
    id: "00460002",
    name: "תכן וניתוח אלגוריתמים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-19",
    examB: "2026-08-19",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "ד\"ר קיריל סולוביי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר עצמון אברהם צבי" },
        ] },
    ],
  },
  {
    id: "00460005",
    name: "רשתות מחשבים ואינטרנט 2",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-05",
    examB: "2026-08-26",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", building: "פישבך-חשמל", room: "505", instructor: "ד\"ר יוסי ילוז" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "17:30", endTime: "18:30", building: "פישבך-חשמל", room: "505", instructor: "מר יבגני רזניק" },
        ] },
    ],
  },
  {
    id: "00460007",
    name: "נושאים נבחרים ברשתות מחשבים למערכות למידה",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-15",
    examB: "2026-08-20",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "403", instructor: "מר גיל בלוך" },
        ] },
    ],
  },
  {
    id: "00460041",
    name: "רשתות עצביות ביולוגיות-חישוביות, עיבוד מידע ולמידה",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-05",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "09:30", endTime: "11:30", building: "פישבך-חשמל", room: "505", instructor: "פרופ' עמרי ברק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "11:30", endTime: "12:30", building: "פישבך-חשמל", room: "505", instructor: "מר אביתר בס" },
        ] },
    ],
  },
  {
    id: "00460044",
    name: "מערכות אנרגיה מתחדשת",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-26",
    examB: "2026-08-23",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "11:30", building: "פישבך-חשמל", room: "505", instructor: "ד\"ר רם מחלב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "09:30", endTime: "10:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "גב' אלינור גינזבורג-גנץ, מר טל ברנדייס" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "גב' אלינור גינזבורג-גנץ" },
        ] },
    ],
  },
  {
    id: "00460045",
    name: "תכן של ממירי מתח ממותגים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-03",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "מר שי בורנשטיין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "מר רום בן אדוה" },
        ] },
    ],
  },
  {
    id: "00460053",
    name: "אופטיקה קוונטית",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-27",
    examB: "2026-08-24",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "פרופסור אמריטוס מאיר אורנשטיין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר גיא סאיר, מר עמית קם" },
        ] },
    ],
  },
  {
    id: "00460054",
    name: "מחשוב קוונטי מודרני",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-22",
    examB: "2026-08-19",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "ד\"ר אורי ריינהרדט" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "גב' שירן אבן חיים" },
        ] },
    ],
  },
  {
    id: "00460188",
    name: "מעגלים אלקטרוניים לאותות מעורבים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-14",
    examB: "2026-08-12",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "ד\"ר קלאודיו יעקובסון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "18:30", endTime: "19:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "ד\"ר אברהם סיג" },
        ] },
    ],
  },
  {
    id: "00460192",
    name: "מערכות בקרה 2",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-20",
    examB: "2026-08-13",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "506", instructor: "פרופ' נחום שימקין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "פישבך-חשמל", room: "506", instructor: "מר אדיר מורגן" },
        ] },
    ],
  },
  {
    id: "00460195",
    name: "מערכות לומדות",
    credit: 3.5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-28",
    examB: "2026-08-18",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "פרופ\"ח יניב רומנו" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "09:30", endTime: "11:30", building: "פישבך-חשמל", room: "507", instructor: "ד\"ר חגי מרון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "15:30", building: "פישבך-חשמל", room: "404", instructor: "מר באסל חמוד" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "פישבך-חשמל", room: "404", instructor: "מר איתי אוסירוף" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "403", instructor: "מר בועז טייטלר" },
        ] },
    ],
  },
  {
    id: "00460200",
    name: "עבוד ונתוח תמונות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-30",
    examB: "2026-08-25",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "504", instructor: "פרופ' יואב שכנר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "09:30", endTime: "10:30", building: "פישבך-חשמל", room: "504", instructor: "מר עומר שנקר, מר טל עובד" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "פישבך-חשמל", room: "403", instructor: "גב' שרה טייץ" },
        ] },
    ],
  },
  {
    id: "00460203",
    name: "תכנון ולמידה מחיזוקים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-28",
    examB: "2026-08-18",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "פרופ\"ח אביב תמר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "מר יניב חסידוף" },
        ] },
    ],
  },
  {
    id: "00460205",
    name: "מבוא לתורת הקידוד בתקשורת",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-02",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "פרופ' יגאל ששון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "פרופ' יגאל ששון" },
        ] },
    ],
  },
  {
    id: "00460206",
    name: "מבוא לתקשורת ספרתית",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-21",
    examB: "2026-08-17",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "ד\"ר אלחנדרו כהן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "17:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "אלון מעיין" },
        ] },
    ],
  },
  {
    id: "00460208",
    name: "טכניקות תקשורת מודרניות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-15",
    examB: "2026-08-16",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "פרופ\"ח ניר וינברגר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "09:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "מר שי גנזך" },
        ] },
    ],
  },
  {
    id: "00460209",
    name: "מבנה מערכות הפעלה",
    credit: 3.5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-21",
    examB: "2026-08-16",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "504", instructor: "מר חובב גזית" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "מר ויסאם היג'א, מר שקד יצחק" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "אוהד איתן" },
        ] },
    ],
  },
  {
    id: "00460213",
    name: "רובוטים ניידים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-02",
    examB: "2026-08-26",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "11:30", endTime: "13:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "ד\"ר קיריל סולוביי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "מר יניב חסידוף" },
        ] },
    ],
  },
  {
    id: "00460215",
    name: "למידה עמוקה וחבורות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-14",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", building: "פישבך-חשמל", room: "403", instructor: "ד\"ר חגי מרון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "17:30", endTime: "18:30", building: "פישבך-חשמל", room: "403", instructor: "מר שניר הורדן" },
        ] },
    ],
  },
  {
    id: "00460217",
    name: "למידה עמוקה",
    credit: 3.5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-16",
    examB: "2026-08-17",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "404", instructor: "פרופ\"ח יוסף קשת" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "מר שהם גרינבלט" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "מר רוי מאור לוטן" },
        ] },
    ],
  },
  {
    id: "00460225",
    name: "עקרונות פיזיקליים של התקני מל\"מ",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-31",
    examB: "2026-08-28",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "15:30", endTime: "17:30", building: "פישבך-חשמל", room: "507", instructor: "ד\"ר עמנואל בר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "17:30", endTime: "18:30", building: "פישבך-חשמל", room: "507", instructor: "מר איתן קמינסקי" },
        ] },
    ],
  },
  {
    id: "00460231",
    name: "מעגלים משולבים – מבוא ל- VLSI",
    credit: 3.5,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-26",
    examB: "2026-08-23",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "08:30", endTime: "10:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "פרופ\"ח אריאל כהן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "504", instructor: "מר אורי גבאי" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "507", instructor: "גב' שרון פונרובסקי" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "403", instructor: "גב' אסאלה אחמד" },
        ] },
    ],
  },
  {
    id: "00460239",
    name: "מעבדה בננו-אלקטרוניקה",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "ננו-אלקטרוניקה", room: "465", instructor: "פרופ' ניר טסלר" },
        ] },
    ],
  },
  {
    id: "00460240",
    name: "התקנים קוונטיים על-מוליכים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-04",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "11:30", building: "פישבך-חשמל", room: "506", instructor: "פרופ\"ח איל בוקס" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "11:30", endTime: "12:30", building: "פישבך-חשמל", room: "506", instructor: "גב' עפרי רובל" },
        ] },
    ],
  },
  {
    id: "00460243",
    name: "טכנולוגיות קוונטיות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-19",
    examB: "2026-08-16",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "11:30", building: "פישבך-חשמל", room: "504", instructor: "פרופ' עידו קמינר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "11:30", endTime: "12:30", building: "פישבך-חשמל", room: "504", instructor: "מר נתן רגב" },
        ] },
    ],
  },
  {
    id: "00460249",
    name: "מערכות אלקטרו-אופטיות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-16",
    examB: "2026-08-28",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "403", instructor: "פרופ\"ח אמיר רוזנטל" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "פישבך-חשמל", room: "403", instructor: "מר עודד מאיר יונתן שילר" },
        ] },
    ],
  },
  {
    id: "00460267",
    name: "מבנה מחשבים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-05",
    examB: "2026-08-31",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "פישבך-חשמל", room: "504", instructor: "ד\"ר אלעד הדר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "09:30", endTime: "10:30", building: "פישבך-חשמל", room: "504" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "17:30", building: "הנד' חשמל בלה מאייר", room: "352" },
        ] },
    ],
  },
  {
    id: "00460271",
    name: "תכנות ותכן מונחה עצמים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-22",
    examB: "2026-08-16",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר יאיר משה" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "11:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר ויסאם היג'א" },
        ] },
    ],
  },
  {
    id: "00460272",
    name: "מערכות מבוזרות: עקרונות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-13",
    examB: "2026-08-13",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "פישבך-חשמל", room: "404", instructor: "ד\"ר נעמה בן דוד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "פישבך-חשמל", room: "404" },
        ] },
    ],
  },
  {
    id: "00460275",
    name: "תרגום ואופטימיזציה דינמיים של קוד בינארי",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "פישבך-חשמל", room: "504", instructor: "ד\"ר גד הבר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "18:30", endTime: "19:30", building: "פישבך-חשמל", room: "504", instructor: "ד\"ר גד הבר" },
        ] },
    ],
  },
  {
    id: "00460277",
    name: "הבטחת נכונות של תוכנה",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-16",
    examB: "2026-08-12",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "ד\"ר דנה דרקסלר כהן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "מר תם יובילר" },
        ] },
    ],
  },
  {
    id: "00460278",
    name: "מאיצים חישוביים ומערכות מואצות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-03",
    examB: "2026-08-26",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "15:30", endTime: "17:30", building: "פישבך-חשמל", room: "403", instructor: "פרופ' מרק זילברשטיין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "17:30", endTime: "18:30", building: "פישבך-חשמל", room: "403" },
        ] },
    ],
  },
  {
    id: "00460279",
    name: "חישוב מקבילי מואץ",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-31",
    examB: "2026-08-21",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", building: "פישבך-חשמל", room: "404", instructor: "ד\"ר יריב ארידור" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "17:30", endTime: "18:30", building: "פישבך-חשמל", room: "404", instructor: "פרי לדר, ד\"ר יריב ארידור" },
        ] },
    ],
  },
  {
    id: "00460342",
    name: "מבוא לתקשורת בסיבים אופטיים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-02",
    examB: "2026-08-25",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "ד\"ר פבל סידורנקו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "17:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "ד\"ר אמנון וילינגר" },
        ] },
    ],
  },
  {
    id: "00460733",
    name: "תורת האינפורמציה",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-28",
    examB: "2026-08-24",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "11:30", endTime: "13:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "פרופ' יגאל ששון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "מר איתי גבע" },
        ] },
    ],
  },
  {
    id: "00460735",
    name: "סודיות קוונטית",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-30",
    examB: "2026-08-26",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "11:30", endTime: "13:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "ד\"ר עוזיהו (עוזי) פרג" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "13:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "מר חוסין נאטור" },
        ] },
    ],
  },
  {
    id: "00460831",
    name: "מבוא לדימות רפואי",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-26",
    examB: "2026-08-23",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "11:30", building: "פישבך-חשמל", room: "507", instructor: "פרופ\"ח גיא גלבוע" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "11:30", endTime: "12:30", building: "פישבך-חשמל", room: "507", instructor: "מר איליה קרבצ'יק, מר טל עובד" },
        ] },
    ],
  },
  {
    id: "00460864",
    name: "ערוצי תקשורת מהירים בין שבבים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-20",
    examB: "2026-08-20",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "165", instructor: "מר ערן עיני, מר ערן גרסון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "09:30", building: "פישבך-חשמל", room: "507", instructor: "מר אביתר ודס" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "17:30", endTime: "18:30", building: "פישבך-חשמל", room: "504", instructor: "מר אביתר ודס, מר אופיר גליק" },
        ] },
    ],
  },
  {
    id: "00460868",
    name: "יסודות תהליכים אקראיים",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-04",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "פרופ' רמי אתר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "18:30", endTime: "19:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "אלון מעיין" },
        ] },
    ],
  },
  {
    id: "00460882",
    name: "נ.נ. בתכנון משולב חומרה/תוכנה",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "פישבך-חשמל", room: "507", instructor: "פרופ\"ח יואב עציון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "פישבך-חשמל", room: "507" },
        ] },
    ],
  },
  {
    id: "00460887",
    name: "מבוא למחקר בפקולטה",
    credit: 1,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "09:30", building: "פישבך-חשמל", room: "507", instructor: "פרופ\"ח יצחק בירק" },
        ] },
    ],
  },
  {
    id: "00460903",
    name: "מעגלים משולבים בתדר רדיו",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-05",
    examB: "2026-08-26",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "פרופ\"ח עמנואל כהן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "גב' הנד עומרי" },
        ] },
    ],
  },
  {
    id: "00460918",
    name: "תכן פיסי של מערכות VLSI",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-07-30",
    examB: "2026-08-25",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "ד\"ר קונסטנטין מויסייב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "17:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "ד\"ר אלכסנדר סבטליצה" },
        ] },
    ],
  },
  {
    id: "00460968",
    name: "מיקרו-עיבוד ומיקרו-מערכות אלקטרומכניות",
    credit: 3,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    examA: "2026-08-03",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "פרופסור אמריטוס יעל נמירובסקי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "ד\"ר שלמה בושר" },
        ] },
    ],
  },
  {
    id: "00480004",
    name: "עיבוד וניתוח גיאומטרי של מידע",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "פרופ' רונן טלמון" },
        ] },
    ],
  },
  {
    id: "00480081",
    name: "נושאים נבחרים ברשתות תקשורת עובר מרכזי חישוב של בינה מלאכותית",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "פרופ' מרק זילברשטיין" },
        ] },
    ],
  },
  {
    id: "00480082",
    name: "נושאים נבחרים באבטחת מערכות תוכנה",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "ד\"ר יניב (משה) דוד" },
        ] },
    ],
  },
  {
    id: "00480104",
    name: "שיטות מונטה-קרלו לחישוב, למידה ותכנון",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "351" },
        ] },
    ],
  },
  {
    id: "00480201",
    name: "נושאים נבחרים בלמידה רובוטית",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "13:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "פרופ\"ח אביב תמר" },
        ] },
    ],
  },
  {
    id: "00480202",
    name: "נ. ברובוטיקה: נהיגה מרוץ אוטונומי",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "ד\"ר קיריל סולוביי" },
        ] },
    ],
  },
  {
    id: "00480250",
    name: "קידוד רשת למערכות מידע ותקשורת",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "ד\"ר אלחנדרו כהן" },
        ] },
    ],
  },
  {
    id: "00480300",
    name: "נושאים בהסתברות ותהליכים אקראיים",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "14:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "פרופ' רמי אתר" },
        ] },
    ],
  },
  {
    id: "00480350",
    name: "נושאים בלמידה עמוקה להדמיה רפואית",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "ד\"ר אפרת שמרון" },
        ] },
    ],
  },
  {
    id: "00480351",
    name: "עיבוד אותות ברפואהדיגיטלית",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "13:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "ד\"ר דניאל לנגה" },
        ] },
    ],
  },
  {
    id: "00480402",
    name: "נושאים נבחרים באופטיקה קוונטית",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "ד\"ר אביב קרניאלי" },
        ] },
    ],
  },
  {
    id: "00480450",
    name: "נושאים נבחרים בתכנון מעגלים משולבים ומערכת עבור משדרים־מקלטים אופטיים",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "פרופ\"ח אריאל כהן" },
        ] },
    ],
  },
  {
    id: "00480823",
    name: "שיטות אנליטיות בתורת הגלים 1",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "13:30", endTime: "15:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "פרופ\"ח אריאל אפשטיין" },
        ] },
    ],
  },
  {
    id: "00480886",
    name: "סמינר במערכות מחשב",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", instructor: "פרופ\"ח יואב עציון" },
        ] },
    ],
  },
  {
    id: "00480907",
    name: "אופטיקה בתווכים מפזרים ויישומיה בדימות ביו-רפואי",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "351", instructor: "פרופ\"ח אמיר רוזנטל" },
        ] },
    ],
  },
  {
    id: "00480954",
    name: "שיטות סטטיסטיות בעיבוד תמונה",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "11:30", endTime: "13:30", building: "הנד' חשמל בלה מאייר", room: "353", instructor: "פרופ' תומר מיכאלי" },
        ] },
    ],
  },
  {
    id: "00490037",
    name: "נושאים מתקדמים בוי.ל.ס.י 2",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "ד\"ר ניקולס ויינשטיין" },
        ] },
    ],
  },
  {
    id: "00490061",
    name: "צפני קיטוב",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "352", instructor: "פרופ\"ח עדו טל" },
        ] },
    ],
  },
  {
    id: "00490063",
    name: "מידע בהתקני איחסון",
    credit: 2,
    faculty: "הפקולטה להנדסת חשמל ומחשבים",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "הנד' חשמל בלה מאייר", room: "354", instructor: "פרופ' יובל קסוטו" },
        ] },
    ],
  },
  {
    id: "00940139",
    name: "נהול שרשראות אספקה ומע' לוגיסטיות",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-22",
    examB: "2026-08-13",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "17:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "פרופ\"ח גלית יום-טוב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "17:30", endTime: "18:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
    ],
  },
  {
    id: "00940195",
    name: "פרויקט תכן 1, הנ. תעו\"נ",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "17:30", endTime: "20:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "פרופ' יל הרר" },
        ] },
    ],
  },
  {
    id: "00940202",
    name: "מבוא לניתוח נתונים",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-26",
    examB: "2026-08-16",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "09:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "גב' הדר שלו" },
        ] },
      { id: "15", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "12:30", building: "הנדסה אזרחית רבין", room: "206", instructor: "פרופ\"ח עפרה עמיר" },
        ] },
      { id: "11", type: "lab", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "אורי גולדפריד" },
        ] },
      { id: "12", type: "lab", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "בלומפילד - מדעי הנתונים", room: "153", instructor: "מר עמרי סביר" },
        ] },
      { id: "13", type: "lab", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "אורי גולדפריד" },
        ] },
      { id: "15", type: "lab", lessons: [
          { day: 1, startTime: "13:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "מר עידן הורוביץ" },
        ] },
      { id: "16", type: "lab", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "הנדסה אזרחית רבין", room: "302", instructor: "מר עידן הורוביץ" },
        ] },
      { id: "17", type: "lab", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "הנדסה אזרחית רבין", room: "302", instructor: "מר שגיא אוחיון" },
        ] },
      { id: "18", type: "lab", lessons: [
          { day: 4, startTime: "15:30", endTime: "17:30", building: "הנדסה אזרחית רבין", room: "302", instructor: "מר שגיא אוחיון" },
        ] },
      { id: "19", type: "lab", lessons: [
          { day: 1, startTime: "17:30", endTime: "19:30", building: "הנדסה אזרחית רבין", room: "404", instructor: "מר עמרי סביר" },
        ] },
    ],
  },
  {
    id: "00940210",
    name: "ארגון המחשב ומערכות הפעלה",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-22",
    examB: "2026-08-14",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "פרופ' עופר שטריכמן" },
          { day: 4, startTime: "14:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "פרופ' עופר שטריכמן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "216" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "15:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
    ],
  },
  {
    id: "00940219",
    name: "הנדסת תוכנה",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-31",
    examB: "2026-08-23",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "17:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "ד\"ר אחמד גבארה" },
        ] },
      { id: "11", type: "lab", lessons: [
          { day: 1, startTime: "08:30", endTime: "10:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
      { id: "12", type: "lab", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30" },
        ] },
      { id: "13", type: "lab", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
    ],
  },
  {
    id: "00940224",
    name: "מבני נתונים ואלגוריתמים",
    credit: 4,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-05",
    examB: "2026-08-26",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "09:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "153", instructor: "ד\"ר שרי שינולד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "17:30", endTime: "19:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "מר רועי בן גיגי" },
        ] },
    ],
  },
  {
    id: "00940241",
    name: "ניהול מסדי נתונים",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-10",
    examB: "2026-08-12",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "09:30", endTime: "11:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "ד\"ר בתיה קניג" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "אפק וקנין" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "15:30", endTime: "16:30" },
        ] },
      { id: "11", type: "lab", lessons: [
          { day: 2, startTime: "15:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "אפק וקנין" },
        ] },
      { id: "12", type: "lab", lessons: [
          { day: 0, startTime: "16:30", endTime: "17:30" },
        ] },
    ],
  },
  {
    id: "00940288",
    name: "נושאים אתיים באחריות בנתונים",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "16:30", endTime: "20:30", building: "קופר- מדעי הנתונים", room: "112", instructor: "פרופ' אביגדור גל" },
        ] },
    ],
  },
  {
    id: "00940295",
    name: "מעבדה בניתוח והצגת נתונים",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lab", lessons: [
          { day: 0, startTime: "17:30", endTime: "21:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "מר בר גנוסר" },
        ] },
    ],
  },
  {
    id: "00940312",
    name: "מודלים דטרמיניסטים בחקר ביצועים",
    credit: 4,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-04",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "112" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "153" },
        ] },
    ],
  },
  {
    id: "00940314",
    name: "מודלים סטוכסטיים בחקר בצועים",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-19",
    examB: "2026-08-16",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "17:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "פרופ' לאוניד מיטניק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "ידידיה תורגמן" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "מר מנחם פרנקו" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "ייטב דן" },
        ] },
    ],
  },
  {
    id: "00940345",
    name: "מתמטיקה דיסקרטית ת'",
    credit: 4,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-03",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "11:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "ד\"ר שרי שינולד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "153" },
        ] },
    ],
  },
  {
    id: "00940396",
    name: "פרויקט תכן1, הנדסת מ\"מ",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "17:30", endTime: "19:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
    ],
  },
  {
    id: "00940411",
    name: "הסתברות ת'",
    credit: 4,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-05",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "13:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "216" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "בלומפילד - מדעי הנתונים", room: "151" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "בלומפילד - מדעי הנתונים", room: "152" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "153" },
        ] },
    ],
  },
  {
    id: "00940412",
    name: "הסתברות מ",
    credit: 4,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-20",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "18:30", building: "דן קאהן- מכונות", room: "6", instructor: "ד\"ר דניאל רבייב" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "12:30", building: "אולמן", room: "601", instructor: "פרופ\"ח אורן לואידור" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "606" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "506" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "506" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "607" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "506" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "606" },
        ] },
    ],
  },
  {
    id: "00940423",
    name: "מבוא לסטטיסטיקה",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-22",
    examB: "2026-08-24",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "13:30", endTime: "14:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
    ],
  },
  {
    id: "00940424",
    name: "סטטיסטיקה 1",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-22",
    examB: "2026-08-24",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "12:30", instructor: "ד\"ר נדיה בורדו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "13:30", endTime: "14:30", instructor: "ד\"ר נדיה בורדו" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", instructor: "אראל יהלום גלבוע" },
        ] },
    ],
  },
  {
    id: "00940481",
    name: "מבוא להסתברות וסטטיסטיקה",
    credit: 4,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-13",
    examB: "2026-09-01",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "09:30", endTime: "12:30", building: "ליידי דייוס - מכונות", room: "641", instructor: "ד\"ר נדיה בורדו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "13:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "153", instructor: "ד\"ר נדיה בורדו" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "מר עמית אבידן" },
        ] },
    ],
  },
  {
    id: "00940503",
    name: "מיקרו כלכלה 1",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-14",
    examB: "2026-08-20",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "11:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "ד\"ר חובב פרץ" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "09:30", endTime: "10:30", building: "קופר- מדעי הנתונים", room: "113" },
        ] },
    ],
  },
  {
    id: "00940591",
    name: "מבוא לכלכלה",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-26",
    examB: "2026-08-23",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "09:30", endTime: "12:30", building: "אולמן", room: "803" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "203" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "203" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 1, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "203" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "203" },
        ] },
      { id: "15", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "203" },
        ] },
    ],
  },
  {
    id: "00940600",
    name: "סמינר במדעי הקוגניציה",
    credit: 1,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lab", lessons: [
          { day: 1, startTime: "11:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "ד\"ר יבגני ברזק" },
        ] },
    ],
  },
  {
    id: "00940700",
    name: "מבוא להנדסת נתונים",
    credit: 1.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-05",
    examB: "2026-08-28",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "פרופ' אורן קורלנד" },
        ] },
      { id: "11", type: "lab", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "מר עומר נחום" },
        ] },
      { id: "12", type: "lab", lessons: [
          { day: 1, startTime: "13:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "עודד קפטה" },
        ] },
      { id: "13", type: "lab", lessons: [
          { day: 2, startTime: "13:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "מר עומר נחום" },
        ] },
    ],
  },
  {
    id: "00940701",
    name: "פרויקט מחקרי 1",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "seminar", lessons: [
          { day: 0, startTime: "17:30", endTime: "19:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
    ],
  },
  {
    id: "00940702",
    name: "פרויקט מחקרי 2",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "seminar", lessons: [
          { day: 0, startTime: "17:30", endTime: "19:30" },
        ] },
    ],
  },
  {
    id: "00940703",
    name: "פרויקט מחקרי 3",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "seminar", lessons: [
          { day: 0, startTime: "17:30", endTime: "19:30" },
        ] },
    ],
  },
  {
    id: "00940820",
    name: "מבוא לחשבונאות",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-14",
    examB: "2026-08-12",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "15:30", endTime: "17:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "מר ירון חיים" },
        ] },
    ],
  },
  {
    id: "00940825",
    name: "בקרת עלויות",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-14",
    examB: "2026-08-17",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "18:30", endTime: "20:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "מר ירון חיים" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "20:30", endTime: "21:30", building: "קופר- מדעי הנתונים", room: "113" },
        ] },
    ],
  },
  {
    id: "00950113",
    name: "איכות פריון ותחזוקה",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-22",
    examB: "2026-08-12",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "פרופ' איתן נוה" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
    ],
  },
  {
    id: "00950120",
    name: "סמינר במע. ייצור ושרות",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "13:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "פרופ' יל הרר" },
        ] },
    ],
  },
  {
    id: "00950143",
    name: "חשיבה מערכתית בתעשייה וניהול",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "18:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "ד\"ר אלכס בלכמן" },
        ] },
    ],
  },
  {
    id: "00950219",
    name: "כתיבת תוכנה ללמידת מכונה",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "מר נועם אשר כהן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "מר אלעד כדורי כליף" },
        ] },
    ],
  },
  {
    id: "00950280",
    name: "פרויקט תכן בלמידה חישובית",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "14:30", endTime: "16:30", instructor: "פרופ' רועי רייכרט" },
        ] },
      { id: "11", type: "seminar", lessons: [
          { day: 4, startTime: "13:30", endTime: "14:30" },
        ] },
    ],
  },
  {
    id: "00950605",
    name: "מבוא לפסיכולוגיה",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-26",
    examB: "2026-08-19",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "ד\"ר ורד ערב-יהנה" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "151" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "מר תובל רז" },
        ] },
    ],
  },
  {
    id: "00950622",
    name: "מבוא למדעי המוח הקוגניטיביים",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "פרופ\"ח יועד קנת" },
        ] },
    ],
  },
  {
    id: "00960122",
    name: "סמינר באנליזה של רשתות בריאות",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "ד\"ר נועה ז'יכלינסקי" },
        ] },
    ],
  },
  {
    id: "00960135",
    name: "ניהול מוצר בעולם הדיגיטלי",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "פרופ' כרמל דומשלק" },
        ] },
    ],
  },
  {
    id: "00960200",
    name: "כלים מתמטיים למדעי הנתונים",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "11:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "פרופ\"ח אביתר פרוקצ'ה" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "אמילי בדרוב" },
        ] },
    ],
  },
  {
    id: "00960208",
    name: "בינה מלאכותית ומערכות אוטונומיות",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "08:30", endTime: "10:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "ד\"ר אלכסנדר שלייפמן" },
        ] },
      { id: "11", type: "seminar", lessons: [
          { day: 1, startTime: "10:30", endTime: "11:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "מר איתי בריט" },
        ] },
    ],
  },
  {
    id: "00960211",
    name: "מודלים למסחר אלקטרוני",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-09",
    examB: "2026-08-30",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "ד\"ר עומר בן פורת" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "15:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "15:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "214" },
        ] },
    ],
  },
  {
    id: "00960212",
    name: "מודלים גרפים הסתברותיים",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-04",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "ד\"ר בתיה קניג" },
        ] },
    ],
  },
  {
    id: "00960222",
    name: "שפה חישוביות וקוגניציה",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "ד\"ר יבגני ברזק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "424" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "17:30", building: "בלומפילד - מדעי הנתונים", room: "424" },
        ] },
    ],
  },
  {
    id: "00960224",
    name: "ניהול מידע מבוזר",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-24",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "פרופ' אביגדור גל" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "18:30", endTime: "19:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "מר אניס ברהום" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "אביב קפיטולניק" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "15:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "אביב קפיטולניק" },
        ] },
    ],
  },
  {
    id: "00960232",
    name: "אתיקה של נתונים",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "16:30", endTime: "20:30" },
        ] },
    ],
  },
  {
    id: "00960236",
    name: "למידה יוצרת ומודלי דיפוזיה",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-13",
    examB: "2026-08-27",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "152" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "527" },
        ] },
    ],
  },
  {
    id: "00960237",
    name: "מערכות סוכני בינה מלאכותית",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "08:30", endTime: "10:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "מר עידן האן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "10:30", endTime: "11:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
    ],
  },
  {
    id: "00960262",
    name: "אחזור מידע",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-15",
    examB: "2026-08-12",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "פרופ' אורן קורלנד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "אנטל לוקצקי" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "אנטל לוקצקי" },
        ] },
    ],
  },
  {
    id: "00960266",
    name: "חווית משתמש במערכות אינטראקטיביות",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "ד\"ר נירית גביש" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "08:30", endTime: "09:30", building: "בלומפילד - מדעי הנתונים", room: "153" },
        ] },
    ],
  },
  {
    id: "00960267",
    name: "מבוא לתכנות מאובטח",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examB: "2026-08-24",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "ד\"ר אחמד גבארה, מר טל אלוני" },
          { day: 3, startTime: "10:30", endTime: "11:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "ד\"ר אחמד גבארה, מר טל אלוני" },
        ] },
    ],
  },
  {
    id: "00960291",
    name: "מסחר אלגוריתמי בתדירות גבוהה",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", instructor: "ד\"ר אייל נוימן" },
        ] },
    ],
  },
  {
    id: "00960324",
    name: "הנדסת מערכות שירות",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-05",
    examB: "2026-08-31",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "17:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "פרופ\"ח גלית יום-טוב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "17:30", endTime: "18:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "151" },
        ] },
    ],
  },
  {
    id: "00960327",
    name: "מודלים לא לינאריים בחקר ביצועים",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-29",
    examB: "2026-08-20",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "11:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "ד\"ר שאול נדב חלק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "נגה רם" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "11:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "מר דן גרינשטיין" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "153", instructor: "מר אניס ברהום" },
        ] },
    ],
  },
  {
    id: "00960336",
    name: "שיטות אופטימיזציה בלמידת מכונה",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "112", instructor: "פרופ\"ח דן גרבר" },
        ] },
    ],
  },
  {
    id: "00960411",
    name: "למידה חישובית 1",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-15",
    examB: "2026-08-23",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "11:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "ד\"ר נירית נוסבאום-הופר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "יעקב פרידמן" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "17:30", endTime: "18:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "טל שול" },
        ] },
    ],
  },
  {
    id: "00960412",
    name: "ניהול וכריית תהליכים עסקיים",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "17:30", endTime: "19:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "מר אריק סנדרוביץ" },
          { day: 2, startTime: "17:30", endTime: "19:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "מר אריק סנדרוביץ" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "19:30", endTime: "20:30", building: "בלומפילד - מדעי הנתונים", room: "151" },
          { day: 2, startTime: "19:30", endTime: "20:30", building: "בלומפילד - מדעי הנתונים", room: "151" },
        ] },
    ],
  },
  {
    id: "00960415",
    name: "נושאים ברגרסיה",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "פרופ\"ח דוד עזריאל" },
        ] },
    ],
  },
  {
    id: "00960426",
    name: "ניתוח הישרדות בשיטות למידת מכונה",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "ד\"ר יעל טרוויס-לומר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "בלומפילד - מדעי הנתונים", room: "527" },
        ] },
    ],
  },
  {
    id: "00960475",
    name: "תכנון ניסויים וניתוחם",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "86", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "11:30", building: "ליידי דייוס - מכונות", room: "441", instructor: "ד\"ר ג'קי אשר" },
        ] },
      { id: "86", type: "tutorial", lessons: [
          { day: 0, startTime: "11:30", endTime: "12:30", building: "ליידי דייוס - מכונות", room: "441", instructor: "ד\"ר ג'קי אשר" },
        ] },
    ],
  },
  {
    id: "00960501",
    name: "כלכלה למהנדסי מערכות",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "95", type: "lecture", lessons: [
          { day: 2, startTime: "17:00", endTime: "20:00", instructor: "ד\"ר אליקים בן-חקון" },
        ] },
      { id: "98", type: "lecture", lessons: [
          { day: 1, startTime: "09:00", endTime: "12:00", instructor: "ד\"ר אליקים בן-חקון" },
        ] },
    ],
  },
  {
    id: "00960555",
    name: "כלכלת סקטור ציבורי",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "14:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "ד\"ר אליקים בן-חקון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "16:30", endTime: "17:30", building: "בלומפילד - מדעי הנתונים", room: "152" },
        ] },
    ],
  },
  {
    id: "00960556",
    name: "שוקי אופציות",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-19",
    examB: "2026-08-19",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "17:30", endTime: "19:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "ד\"ר מחמוד קעדאן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "19:30", endTime: "20:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
    ],
  },
  {
    id: "00960567",
    name: "כלכלת מיקום",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "17:30", endTime: "19:30", instructor: "ד\"ר אליקים בן-חקון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "19:30", endTime: "20:30", instructor: "ד\"ר אליקים בן-חקון" },
        ] },
    ],
  },
  {
    id: "00960570",
    name: "תורת המשחקים והתנהגות כלכלית",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-02",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "11:30", building: "בלומפילד - מדעי הנתונים", room: "153", instructor: "פרופ' יעקב בביצ'נקו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "17:30", endTime: "18:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "מר עומר מדמון" },
        ] },
    ],
  },
  {
    id: "00960573",
    name: "תורת המכרזים",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "11:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "פרופ\"ח רשף מאיר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "קופר- מדעי הנתונים", room: "113" },
        ] },
    ],
  },
  {
    id: "00960576",
    name: "למידה וסיבוכיות בתורת המשחקים",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "פרופ' יעקב בביצ'נקו" },
        ] },
    ],
  },
  {
    id: "00960589",
    name: "אקונומטריקה למתקדמים",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "09:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "ד\"ר אבישי עייש" },
        ] },
    ],
  },
  {
    id: "00960617",
    name: "חשיבה וקבלת החלטות",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-16",
    examB: "2026-08-16",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "11:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "ד\"ר אורי פלונסקי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
    ],
  },
  {
    id: "00960620",
    name: "קוגניציה אנושית ויישומיה",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "גב' תרצה לוטרמן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "15:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "424" },
        ] },
    ],
  },
  {
    id: "00960625",
    name: "הצגת מידע חזותי וקוגניציה",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "גב' יעל אלבו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30" },
        ] },
    ],
  },
  {
    id: "00960644",
    name: "סמינר מחקרי בפסיכולוגיה סביבתית",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", instructor: "ד\"ר עטר הרציגר" },
        ] },
    ],
  },
  {
    id: "00960690",
    name: "כלכלה התנהגותית: למידה וארגונים",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-29",
    examB: "2026-08-25",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "11:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "פרופ\"ח כנרת תיאודורסקו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "13:30", endTime: "14:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "גב' נועה פלמון" },
        ] },
    ],
  },
  {
    id: "00960693",
    name: "רשתות פסיכולוגיות וקוגניטיביות",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "פרופ\"ח יועד קנת" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "קופר- מדעי הנתונים", room: "216" },
        ] },
    ],
  },
  {
    id: "00960694",
    name: "מטה קוגניציה",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "112", instructor: "פרופ' רקפת אקרמן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "09:30", endTime: "10:30", building: "קופר- מדעי הנתונים", room: "112", instructor: "גב' תרצה לוטרמן" },
        ] },
    ],
  },
  {
    id: "00960820",
    name: "מערכות ניהול קשרי לקוחות",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "ד\"ר משה דוידוב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30" },
        ] },
    ],
  },
  {
    id: "00970140",
    name: "שיטות מתקדמות בניהול פרויקטים",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "16:30", endTime: "19:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "ד\"ר מיכל אילוז מימוני" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "19:30", endTime: "20:30", building: "בלומפילד - מדעי הנתונים", room: "527" },
        ] },
    ],
  },
  {
    id: "00970202",
    name: "ראייה ממוחשבת מודרנית",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "13:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "ד\"ר אסף שוחר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "16:30", endTime: "17:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "פרנסואה אורן שיקלי" },
        ] },
    ],
  },
  {
    id: "00970203",
    name: "למידה על ידי חיזוקים",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-27",
    examB: "2026-08-23",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "09:30", endTime: "11:30", instructor: "ד\"ר נדב מרליס" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "11:30", endTime: "12:30" },
        ] },
    ],
  },
  {
    id: "00970209",
    name: "למידה חישובית 2",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-02",
    examB: "2026-08-24",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "ד\"ר אור שריר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "09:30", building: "קופר- מדעי הנתונים", room: "214", instructor: "מר דניאל קוזין" },
        ] },
    ],
  },
  {
    id: "00970215",
    name: "עיבוד שפה טבעית",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-08-03",
    examB: "2026-08-27",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "ד\"ר אייל בן דוד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "153" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "15:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
    ],
  },
  {
    id: "00970222",
    name: "ראייה ממוחשבת ויישומיה בחדר ניתוח",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", instructor: "ד\"ר שלומי לויפר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30" },
        ] },
    ],
  },
  {
    id: "00970246",
    name: "מודלי חישוב חברתי",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", instructor: "פרופ' משה טננהולץ" },
        ] },
    ],
  },
  {
    id: "00970251",
    name: "אספקטים אסטרטגיים בלמידת מכונה",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "ד\"ר עומר בן פורת" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "מר בועז טייטלר" },
        ] },
    ],
  },
  {
    id: "00970400",
    name: "מבוא להסקה סיבתית",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-20",
    examB: "2026-08-28",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "פרופ\"ח גלית יום-טוב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "216" },
        ] },
    ],
  },
  {
    id: "00970402",
    name: "נושאים נבחרים באופטימיזציה: שיטות אופטימיזציה ללא הטלות",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", instructor: "פרופ\"ח דן גרבר" },
        ] },
    ],
  },
  {
    id: "00970403",
    name: "נושאים נבחרים בלמידת מכונה: למידת מכונה לחיזוי",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-22",
    examB: "2026-08-20",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "17:30", endTime: "19:30", instructor: "מר רון לבקוביץ" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "19:30", endTime: "20:30" },
        ] },
    ],
  },
  {
    id: "00970404",
    name: "נושאים נבחרים בסטטיסטיקה : מתודולוגיה של סקרים",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "11:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "112", instructor: "פרופ' יאיר גולדברג" },
        ] },
    ],
  },
  {
    id: "00970405",
    name: "נושאים נבחרים במדעי הנתונים: מדעי המוח ונתונים עצביים",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "153", instructor: "ד\"ר הדס בן איסטי" },
        ] },
    ],
  },
  {
    id: "00970406",
    name: "נושאים נבחרים בהסתברות: סמינר בבעיות מחקר מודרניות בהסתברות",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", instructor: "פרופ\"ח אביתר פרוקצ'ה" },
        ] },
    ],
  },
  {
    id: "00970407",
    name: "נושאים נבחרים בהסתברות: השדה הגאוסיאני החופשי והגרביטציה הקוואנטית של ליוביל",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "פרופ\"ח אורן לואידור" },
        ] },
    ],
  },
  {
    id: "00970408",
    name: "נושאים נבחרים במדעי הנתונים: סיבתיות ולמידה חישובית",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "15:30", endTime: "17:30", building: "בלומפילד - מדעי הנתונים", room: "153", instructor: "ד\"ר יואב וולד" },
        ] },
    ],
  },
  {
    id: "00970414",
    name: "סטטיסטיקה 2",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-22",
    examB: "2026-08-13",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "08:30", endTime: "09:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "פרופ' יאיר גולדברג" },
          { day: 1, startTime: "13:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "100", instructor: "פרופ' יאיר גולדברג" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "11:30", building: "קופר- מדעי הנתונים", room: "215" },
        ] },
    ],
  },
  {
    id: "00970447",
    name: "מבוא לחישוביות וסיבוכיות",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-12",
    examB: "2026-08-14",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "13:30", endTime: "15:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "פרופ' עופר שטריכמן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "15:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "215", instructor: "מר עופר גוטמן" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "09:30", endTime: "10:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "מר איתי אורן" },
        ] },
    ],
  },
  {
    id: "00970449",
    name: "סטטיסטיקה אי פרמטרית",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-13",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "פרופ\"ח מרינה בוגומולוב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "ד\"ר נדיה בורדו" },
        ] },
    ],
  },
  {
    id: "00970644",
    name: "פסיכולוגיה תרבותית",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "בלומפילד - מדעי הנתונים", room: "526", instructor: "ד\"ר אלון וישקין" },
        ] },
    ],
  },
  {
    id: "00970800",
    name: "עקרונות השיווק",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "09:30", endTime: "12:30", building: "קופר- מדעי הנתונים", room: "216", instructor: "גב' עינב פרלה" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "קופר- מדעי הנתונים", room: "216" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "13:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "151" },
        ] },
    ],
  },
  {
    id: "00970920",
    name: "נושאים בעיבוד שפה טבעית ממחקרי",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "פרופ' רועי רייכרט" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "14:30", endTime: "15:30", building: "בלומפילד - מדעי הנתונים", room: "151", instructor: "גב' לוטם פלד" },
        ] },
    ],
  },
  {
    id: "00970980",
    name: "נושאים בפרטיות ואתיקה של מידע",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-21",
    examB: "2026-08-13",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "בלומפילד - מדעי הנתונים", room: "527", instructor: "ד\"ר רן וולף" },
        ] },
    ],
  },
  {
    id: "00980123",
    name: "ניהול פרויקטים להנדסת מערכות",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "98", type: "lecture", lessons: [
          { day: 2, startTime: "09:00", endTime: "16:00" },
        ] },
    ],
  },
  {
    id: "00980291",
    name: "פרקטיקום (התנסות מעשית) בארגונים",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "ד\"ר ורד ערב-יהנה" },
        ] },
    ],
  },
  {
    id: "00980322",
    name: "סמינר במתודולוגיות באופטימיזציה",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "424", instructor: "ד\"ר שאול נדב חלק" },
        ] },
    ],
  },
  {
    id: "00980414",
    name: "תיאוריה סטטיסטית",
    credit: 3,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-24",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "13:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "112", instructor: "פרופ\"ח דוד עזריאל" },
        ] },
    ],
  },
  {
    id: "00980423",
    name: "מבוא לתהליכים סטוכסטיים 2",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "פרופ' לאוניד מיטניק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "13:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "153" },
        ] },
    ],
  },
  {
    id: "00980435",
    name: "סמינר בהסתברות ותהליכים סטוכסטיים",
    credit: 2,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "11:30", endTime: "13:30" },
        ] },
    ],
  },
  {
    id: "00980460",
    name: "יישומי ניתוח רב-משתני",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "13:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "ד\"ר אלון וישקין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "בלומפילד - מדעי הנתונים", room: "152", instructor: "ד\"ר נדיה בורדו" },
        ] },
    ],
  },
  {
    id: "00980611",
    name: "שיטות מדעי הנתונים למדעי ההתנהגות",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    examA: "2026-07-14",
    examB: "2026-08-13",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "14:30", endTime: "16:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "ד\"ר אורי פלונסקי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "16:30", endTime: "17:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "גב' אתיל מנסור" },
        ] },
    ],
  },
  {
    id: "00980960",
    name: "ביצועים ומיטביות סוביק. של עובדים",
    credit: 2.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "11:30", instructor: "ד\"ר דנה הררי-חמם" },
        ] },
      { id: "11", type: "seminar", lessons: [
          { day: 1, startTime: "11:30", endTime: "12:30" },
        ] },
    ],
  },
  {
    id: "00990400",
    name: "סדנה בסטטיסטיקה לדוקטורנטים",
    credit: 3.5,
    faculty: "הפקולטה למדעי הנתונים וההחלטות",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "17:30", building: "קופר- מדעי הנתונים", room: "113", instructor: "פרופ\"ח ליאת לבונטין" },
        ] },
    ],
  },
  {
    id: "01040002",
    name: "מושגי יסוד במתמטיקה",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-29",
    examB: "2026-08-25",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "101", instructor: "פרופ\"ח איליה גכטמן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "104", instructor: "מר הלל רז" },
        ] },
    ],
  },
  {
    id: "01040004",
    name: "חשבון דיפרנציאלי ואינטגרלי 2",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-21",
    examB: "2026-08-18",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "707", instructor: "ד\"ר לידיה פרס הרי" },
          { day: 1, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "707", instructor: "ד\"ר לידיה פרס הרי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "17:30", endTime: "19:30", building: "אולמן", room: "506", instructor: "גב' אפרת אבירם" },
        ] },
    ],
  },
  {
    id: "01040012",
    name: "חשבון דיפרנציאלי ואינטגרלי 1ת'",
    credit: 5.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-19",
    examB: "2026-08-17",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "303", instructor: "ד\"ר דניאל רבייב" },
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "303", instructor: "ד\"ר דניאל רבייב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "501", instructor: "גב' איריס שפירא" },
          { day: 2, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "501", instructor: "גב' איריס שפירא" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "310", instructor: "גב' רבקה אביטל" },
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "303", instructor: "גב' רבקה אביטל" },
        ] },
    ],
  },
  {
    id: "01040013",
    name: "חשבון דיפרנציאלי ואינטגרלי 2ת'",
    credit: 5.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-22",
    examB: "2026-08-19",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "ליידי דייוס - מכונות", room: "250", instructor: "ד\"ר עדי וולף" },
          { day: 1, startTime: "08:30", endTime: "10:30", building: "אמדו", room: "233", instructor: "ד\"ר עדי וולף" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "אמדו", room: "233", instructor: "ד\"ר מיכל עמיר" },
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אמדו", room: "233", instructor: "ד\"ר מיכל עמיר" },
        ] },
      { id: "30", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "סגו", room: "1", instructor: "ד\"ר אירנה גורליק" },
          { day: 0, startTime: "14:30", endTime: "16:30", building: "סגו", room: "1", instructor: "ד\"ר אירנה גורליק" },
        ] },
      { id: "40", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "307", instructor: "ד\"ר ניר בן-דוד" },
          { day: 1, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "307", instructor: "ד\"ר ניר בן-דוד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "804", instructor: "מר אחסאן עבד אלפתאח" },
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "804", instructor: "מר אחסאן עבד אלפתאח" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "506", instructor: "גב' איריס שפירא" },
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "501", instructor: "גב' איריס שפירא" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "804", instructor: "גב' אפרת אבירם" },
          { day: 0, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "804", instructor: "גב' אפרת אבירם" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "804", instructor: "מר אחסאן עבד אלפתאח" },
          { day: 0, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "803", instructor: "מר אחסאן עבד אלפתאח" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "301", instructor: "גב' ניקה פת" },
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "506", instructor: "גב' ניקה פת" },
        ] },
      { id: "31", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "310", instructor: "גב' רבקה אביטל" },
          { day: 1, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "303", instructor: "גב' רבקה אביטל" },
        ] },
      { id: "32", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "301", instructor: "גב' יוליה פייגין-קצוב" },
          { day: 1, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "201", instructor: "גב' יוליה פייגין-קצוב" },
        ] },
      { id: "33", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "506", instructor: "גב' איריס שפירא" },
          { day: 1, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "501", instructor: "גב' איריס שפירא" },
        ] },
      { id: "41", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "804", instructor: "גב' אפרת אבירם" },
          { day: 1, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "804", instructor: "גב' אפרת אבירם" },
        ] },
      { id: "42", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "309", instructor: "מר אורן ירושלמי" },
          { day: 1, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "308", instructor: "מר אורן ירושלמי" },
        ] },
      { id: "43", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "307", instructor: "גב' הילה מעין" },
          { day: 0, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "303", instructor: "גב' הילה מעין" },
        ] },
    ],
  },
  {
    id: "01040016",
    name: "אלגברה 1/מורחב",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-24",
    examB: "2026-08-21",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "תחנה לחקר בניה", room: "1", instructor: "ד\"ר עליזה מלק" },
          { day: 2, startTime: "08:30", endTime: "10:30", building: "תחנה לחקר בניה", room: "1", instructor: "ד\"ר עליזה מלק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "305", instructor: "גב' דניאלה אבידן" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "306", instructor: "מר גרשון אברהם" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "309", instructor: "ויויאן לאון" },
        ] },
    ],
  },
  {
    id: "01040018",
    name: "חשבון דיפרנציאלי ואינטגרלי 1מ'",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-19",
    examB: "2026-08-16",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "803", instructor: "ד\"ר יוסף כהן" },
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "804", instructor: "ד\"ר יוסף כהן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "302", instructor: "גב' הילה מעין" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "310", instructor: "מר גרשון אברהם" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "501", instructor: "גב' איריס שפירא" },
        ] },
    ],
  },
  {
    id: "01040019",
    name: "אלגברה ליניארית מ'",
    credit: 4.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-27",
    examB: "2026-08-25",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "גב' דניאלה אבידן" },
          { day: 0, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "גב' דניאלה אבידן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "309", instructor: "ד\"ר ח'ירייה מסארוה" },
        ] },
    ],
  },
  {
    id: "01040022",
    name: "חשבון דיפרנציאלי ואינטגרלי 2מ'",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "87", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "104", instructor: "ד\"ר ניר בן-דוד" },
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "104", instructor: "ד\"ר ניר בן-דוד" },
        ] },
      { id: "87", type: "tutorial", lessons: [
          { day: 2, startTime: "15:30", endTime: "17:30", building: "אולמן", room: "104", instructor: "מר אורן ירושלמי" },
        ] },
    ],
  },
  {
    id: "01040030",
    name: "מבוא למשוואות דיפרנציאליות חלקיות",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-27",
    examB: "2026-08-25",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "102", instructor: "פרופ\"ח רם בנד" },
          { day: 4, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "102", instructor: "פרופ\"ח רם בנד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "102", instructor: "אמתי אלפרין" },
        ] },
    ],
  },
  {
    id: "01040031",
    name: "חשבון אינפיניטסימלי 1מ'",
    credit: 5.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-20",
    examB: "2026-08-21",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "310", instructor: "ד\"ר מיכל קליינשטרן" },
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "803", instructor: "ד\"ר מיכל קליינשטרן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "306", instructor: "מר אחסאן עבד אלפתאח" },
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "306", instructor: "מר אחסאן עבד אלפתאח" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "308", instructor: "גב' יוליה פייגין-קצוב" },
          { day: 0, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "305", instructor: "גב' יוליה פייגין-קצוב" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "308", instructor: "גב' ניקה פת" },
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "308", instructor: "גב' ניקה פת" },
        ] },
    ],
  },
  {
    id: "01040032",
    name: "חשבון אינפיניטסימלי 2מ'",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-17",
    examB: "2026-08-17",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "311", instructor: "ד\"ר מיכל קליינשטרן" },
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "311", instructor: "ד\"ר מיכל קליינשטרן" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "הנד' חשמל בלה מאייר", room: "280", instructor: "ד\"ר אביב צנזור" },
          { day: 0, startTime: "12:30", endTime: "14:30", building: "הנד' חשמל בלה מאייר", room: "280", instructor: "ד\"ר אביב צנזור" },
        ] },
      { id: "30", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", instructor: "ד\"ר אביב צנזור" },
          { day: 4, startTime: "12:30", endTime: "14:30", instructor: "ד\"ר אביב צנזור" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "307", instructor: "גב' רבקה אביטל" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "308", instructor: "מר טל בן יהודה" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "503", instructor: "ד\"ר מיכל עמיר" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "603", instructor: "גב' ניקה פת" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "506", instructor: "מר אורן ירושלמי" },
        ] },
      { id: "24", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "503", instructor: "גב' ליטל שמן" },
        ] },
      { id: "31", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "308", instructor: "גב' יוליה פייגין-קצוב" },
        ] },
      { id: "32", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "308", instructor: "גב' ניקה פת" },
        ] },
      { id: "33", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "701", instructor: "מר טל בן יהודה" },
        ] },
    ],
  },
  {
    id: "01040033",
    name: "אנליזה וקטורית",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-28",
    examB: "2026-08-23",
    groups: [
      { id: "13", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "308", instructor: "ד\"ר אולג קליס" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "308", instructor: "גב' אפרת אבירם" },
        ] },
    ],
  },
  {
    id: "01040034",
    name: "מבוא להסתברות ח'",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-24",
    examB: "2026-08-24",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "803", instructor: "ד\"ר פתחי סאלח" },
          { day: 1, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "803", instructor: "ד\"ר פתחי סאלח" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 2, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "701", instructor: "ד\"ר נתן שמעון ולך" },
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "701", instructor: "ד\"ר נתן שמעון ולך" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "702", instructor: "מר אורן ירושלמי" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "307", instructor: "גב' הילה מעין" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "301", instructor: "גב' ניקה פת" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 0, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "309", instructor: "מר יונתן יעקב קורן" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 1, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "702", instructor: "מר אורי קצ'נוב" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "703", instructor: "מר עומר מויאל" },
        ] },
    ],
  },
  {
    id: "01040038",
    name: "אלגברה 2מ",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-31",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "504", instructor: "פרופ' איתי שפריר" },
        ] },
      { id: "14", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "802", instructor: "ד\"ר מיכל קליינשטרן" },
        ] },
      { id: "30", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "סגו", room: "1", instructor: "ד\"ר אירנה גורליק" },
        ] },
      { id: "40", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "תחנה לחקר בניה", room: "1", instructor: "ד\"ר עדי וולף" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "08:30", endTime: "09:30", building: "אולמן", room: "804", instructor: "גב' אפרת אבירם" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "802", instructor: "ד\"ר עליזה מלק" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "306", instructor: "ד\"ר מיכל עמיר" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "201", instructor: "ד\"ר אירינה סולדטנקו" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 0, startTime: "17:30", endTime: "18:30", building: "אולמן", room: "703", instructor: "מר עומר מויאל" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "305", instructor: "ד\"ר מרים ולך" },
        ] },
      { id: "31", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "503", instructor: "מר עומר מויאל" },
        ] },
      { id: "32", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "301", instructor: "גב' קרואן מלחם" },
        ] },
      { id: "33", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "804", instructor: "גב' אפרת אבירם" },
        ] },
      { id: "41", type: "tutorial", lessons: [
          { day: 2, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "301", instructor: "ויויאן לאון" },
        ] },
      { id: "42", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "802", instructor: "ד\"ר עליזה מלק" },
        ] },
      { id: "43", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "309", instructor: "מר דוד מסעודה" },
        ] },
      { id: "44", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "703", instructor: "מר אוהד שרון" },
        ] },
    ],
  },
  {
    id: "01040041",
    name: "חשבון דיפרנציאלי ואינטגרלי 1מ1",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01040043",
    name: "חשבון דיפרנציאלי ואינטגרלי 2מ1",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-22",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "פיזיקה", room: "323", instructor: "ד\"ר אירנה גורליק" },
          { day: 1, startTime: "14:30", endTime: "16:30", building: "ליידי דייוס - מכונות", room: "250", instructor: "ד\"ר אירנה גורליק" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 1, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "307", instructor: "ד\"ר אייל פרגי" },
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "307", instructor: "ד\"ר אייל פרגי" },
        ] },
      { id: "30", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "סגו", room: "1", instructor: "ד\"ר אלון דמיטריוק" },
          { day: 0, startTime: "10:30", endTime: "12:30", building: "סגו", room: "1", instructor: "ד\"ר אלון דמיטריוק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "804", instructor: "מר אחסאן עבד אלפתאח" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "603", instructor: "גב' ניקה פת" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "310", instructor: "מר גרשון אברהם" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "303", instructor: "מר גרשון אברהם" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "307", instructor: "גב' הילה מעין" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "503", instructor: "גב' גלינה ליטבינוב" },
        ] },
      { id: "31", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "307", instructor: "גב' הילה מעין" },
        ] },
      { id: "32", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "506", instructor: "גב' ניקה פת" },
        ] },
      { id: "33", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "701", instructor: "גב' גלינה ליטבינוב" },
        ] },
    ],
  },
  {
    id: "01040044",
    name: "חשבון דיפרנציאלי ואינטגרלי 2מ2",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-19",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "203", instructor: "ד\"ר נאדר אגא" },
          { day: 2, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "203", instructor: "ד\"ר נאדר אגא" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "311", instructor: "ד\"ר ניר בן-דוד" },
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "311", instructor: "ד\"ר ניר בן-דוד" },
        ] },
      { id: "30", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "תחנה לחקר בניה", room: "1", instructor: "ד\"ר דניאל רבייב" },
          { day: 2, startTime: "16:30", endTime: "18:30", building: "אמדו", room: "233", instructor: "ד\"ר דניאל רבייב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "310", instructor: "מר גרשון אברהם" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "703", instructor: "מר אליעזר אפלבוים" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 0, startTime: "13:30", endTime: "15:30", building: "אולמן", room: "501", instructor: "ד\"ר אולג קליס" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "303", instructor: "מר גרשון אברהם" },
        ] },
      { id: "31", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "803", instructor: "מר אחסאן עבד אלפתאח" },
        ] },
      { id: "32", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "309", instructor: "גב' איריס שפירא" },
        ] },
      { id: "33", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "311", instructor: "גב' רבקה אביטל" },
        ] },
    ],
  },
  {
    id: "01040066",
    name: "אלגברה א'",
    credit: 5.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-21",
    examB: "2026-08-16",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "507", instructor: "פרופ\"ח רם בנד" },
          { day: 4, startTime: "09:30", endTime: "11:30", building: "אולמן", room: "507", instructor: "פרופ\"ח רם בנד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "601", instructor: "מר גלעד סופר" },
          { day: 0, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "601", instructor: "מר גלעד סופר" },
        ] },
    ],
  },
  {
    id: "01040112",
    name: "גיאומטריה וסימטריה",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-08-03",
    examB: "2026-08-28",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "אמדו", room: "619", instructor: "פרופ\"ח דני נפטין" },
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אמדו", room: "619", instructor: "פרופ\"ח דני נפטין" },
        ] },
    ],
  },
  {
    id: "01040114",
    name: "יסודות הגאומטריה",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-15",
    examB: "2026-08-17",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "15:30", building: "אמדו", room: "619", instructor: "פרופ' רועי משולם" },
        ] },
      { id: "10", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "אמדו", room: "719", instructor: "מר יזיד מרעי" },
        ] },
    ],
  },
  {
    id: "01040122",
    name: "תורת הפונקציות 1",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-08-05",
    examB: "2026-08-30",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "15:30", endTime: "18:30", building: "אמדו", room: "234", instructor: "פרופ\"ח לירן רותם" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "15:30", endTime: "16:30", building: "אמדו", room: "234", instructor: "מר יואב סנדנר" },
        ] },
    ],
  },
  {
    id: "01040131",
    name: "משוואות דיפרנציאליות רגילות/ח",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-30",
    examB: "2026-08-25",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "305", instructor: "ד\"ר אולג קליס" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אמדו", room: "233", instructor: "ד\"ר יוסף כהן" },
        ] },
      { id: "30", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "גב' דניאלה אבידן" },
        ] },
      { id: "87", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "104", instructor: "ד\"ר נאדר אגא" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "301", instructor: "גב' קרואן מלחם" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "501", instructor: "ד\"ר אירינה סולדטנקו" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "309", instructor: "גב' גלינה ליטבינוב" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 3, startTime: "08:30", endTime: "09:30", building: "אולמן", room: "303", instructor: "מר גרשון אברהם" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "310", instructor: "גב' מרינה גרוזד" },
        ] },
      { id: "31", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "201", instructor: "גב' ראואן טרביה" },
        ] },
      { id: "32", type: "tutorial", lessons: [
          { day: 3, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "309", instructor: "ד\"ר אירינה סולדטנקו" },
        ] },
      { id: "33", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "301", instructor: "גב' קרואן מלחם" },
        ] },
      { id: "34", type: "tutorial", lessons: [
          { day: 2, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "101", instructor: "גב' ילנה פוגרבניאק" },
        ] },
      { id: "87", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "302", instructor: "גב' מרינה גרוזד" },
        ] },
    ],
  },
  {
    id: "01040134",
    name: "אלגברה מודרנית ח",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-08-02",
    examB: "2026-09-02",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אמדו", room: "233", instructor: "ד\"ר יוסף כהן" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "506", instructor: "ד\"ר דורון אלעד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "301", instructor: "מר יורם יחיא" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "503", instructor: "ד\"ר מיכל עמיר" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "504", instructor: "ד\"ר אירנה גורליק" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 3, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "804", instructor: "גב' אפרת אבירם" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "602", instructor: "גב' ראואן טרביה" },
        ] },
    ],
  },
  {
    id: "01040135",
    name: "משוואות דפרנציאליות רגילות ת'",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-30",
    examB: "2026-08-25",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "305", instructor: "ד\"ר אולג קליס" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "503", instructor: "גב' גלינה ליטבינוב" },
        ] },
    ],
  },
  {
    id: "01040136",
    name: "משוואות דיפרנציאליות רגילות מ",
    credit: 4,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-17",
    examB: "2026-08-14",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "307", instructor: "ד\"ר שלומי גובר" },
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "803", instructor: "ד\"ר שלומי גובר" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "סגו", room: "1", instructor: "מר רן קירי" },
          { day: 1, startTime: "09:30", endTime: "10:30", building: "סגו", room: "1", instructor: "מר רן קירי" },
        ] },
      { id: "30", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אמדו", room: "233", instructor: "ד\"ר דניאל רבייב" },
          { day: 2, startTime: "11:30", endTime: "12:30", building: "אמדו", room: "233", instructor: "ד\"ר דניאל רבייב" },
        ] },
      { id: "40", type: "lecture", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "307", instructor: "ד\"ר ניר בן-דוד" },
          { day: 2, startTime: "14:30", endTime: "15:30", building: "תחנה לחקר בניה", room: "1", instructor: "ד\"ר ניר בן-דוד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "302", instructor: "גב' מרינה גרוזד" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", building: "אולמן", room: "703", instructor: "מר יואב סנדנר" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "301", instructor: "ד\"ר אולג קליס" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "302", instructor: "גב' מרינה גרוזד" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "301", instructor: "ד\"ר רועי בר און" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "17:30", endTime: "19:30", building: "אולמן", room: "301", instructor: "ד\"ר מוחמד אבו-חאמד" },
        ] },
      { id: "24", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "503", instructor: "גב' גלינה ליטבינוב" },
        ] },
      { id: "31", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "310", instructor: "גב' רבקה אביטל" },
        ] },
      { id: "32", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "804", instructor: "גב' אפרת אבירם" },
        ] },
      { id: "33", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "309", instructor: "גב' יוליה פייגין-קצוב" },
        ] },
      { id: "41", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "307", instructor: "גב' רבקה אביטל" },
        ] },
      { id: "42", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "503", instructor: "גב' גלינה ליטבינוב" },
        ] },
      { id: "43", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "308", instructor: "גב' יוליה פייגין-קצוב" },
        ] },
    ],
  },
  {
    id: "01040142",
    name: "מבוא למרחבים מטריים וטופולוגיים",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-20",
    examB: "2026-08-17",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "14:30", endTime: "17:30", building: "אולמן", room: "603", instructor: "ד\"ר איתי גלזר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "601", instructor: "מר עודד רז" },
        ] },
    ],
  },
  {
    id: "01040158",
    name: "מבוא לחבורות",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-16",
    examB: "2026-08-31",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "11:30", endTime: "14:30", building: "אולמן", room: "703", instructor: "פרופ\"ח רון רוזנטל" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "703", instructor: "מר טל בן יהודה" },
        ] },
    ],
  },
  {
    id: "01040165",
    name: "פונקציות ממשיות",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01040166",
    name: "אלגברה אמ'",
    credit: 5.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-14",
    examB: "2026-08-16",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "307", instructor: "ד\"ר פתחי סאלח" },
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "307", instructor: "ד\"ר פתחי סאלח" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "305", instructor: "ד\"ר עליזה מלק" },
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "305", instructor: "ד\"ר עליזה מלק" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "506", instructor: "גב' גלית מזרחי" },
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "601", instructor: "גב' גלית מזרחי" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "307", instructor: "גב' הילה מעין" },
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "308", instructor: "גב' הילה מעין" },
        ] },
    ],
  },
  {
    id: "01040168",
    name: "אלגברה ב",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-16",
    examB: "2026-08-16",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "601", instructor: "ד\"ר אריאל רפפורט" },
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "601", instructor: "ד\"ר אריאל רפפורט" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "506", instructor: "מר אלן סורני" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "309", instructor: "מר יונתן שנייר" },
        ] },
    ],
  },
  {
    id: "01040174",
    name: "אלגברה במ'",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-19",
    examB: "2026-08-20",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "802", instructor: "ד\"ר עדי וולף" },
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "804", instructor: "ד\"ר עדי וולף" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "804", instructor: "גב' שיר דרייב" },
        ] },
    ],
  },
  {
    id: "01040177",
    name: "גיאומטריה דיפרנציאלית",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-20",
    examB: "2026-08-14",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "14:30", endTime: "17:30", building: "אמדו", room: "719", instructor: "פרופ' מיכאל אנטוב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אמדו", room: "619", instructor: "מר מיכאל טולצינסקי" },
        ] },
    ],
  },
  {
    id: "01040181",
    name: "סמינר באנליזה להסמכה 1",
    credit: 2,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אמדו", room: "509", instructor: "פרופ\"ח ניקולאס קרופורד" },
        ] },
    ],
  },
  {
    id: "01040183",
    name: "סמינר באלגברה להסמכה 1",
    credit: 2,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אמדו", room: "509", instructor: "פרופ\"ח צבי יעקב נואר" },
        ] },
    ],
  },
  {
    id: "01040184",
    name: "סמינר באלגברה להסמכה 2",
    credit: 2,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "אמדו", room: "509", instructor: "פרופ\"ח מקסים גורביץ" },
        ] },
    ],
  },
  {
    id: "01040192",
    name: "מבוא למתמטיקה שמושית",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-08-02",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "11:30", building: "אולמן", room: "703", instructor: "פרופ\"ח ניר גביש" },
        ] },
    ],
  },
  {
    id: "01040193",
    name: "תורת האופטימיזציה",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-19",
    examB: "2026-08-18",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אמדו", room: "719", instructor: "פרופ\"ח ניקולאס קרופורד" },
          { day: 0, startTime: "12:30", endTime: "13:30", building: "אמדו", room: "719", instructor: "פרופ\"ח ניקולאס קרופורד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "102", instructor: "ד\"ר ודים דרקץ'" },
        ] },
    ],
  },
  {
    id: "01040195",
    name: "חשבון אינפיניטסימלי 1",
    credit: 5.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-16",
    examB: "2026-08-20",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "11:30", endTime: "13:30", building: "אולמן", room: "309", instructor: "פרופ' אהוד משה ברוך" },
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "309", instructor: "פרופ' אהוד משה ברוך" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "503", instructor: "מר עומר מויאל" },
          { day: 0, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "503", instructor: "מר עומר מויאל" },
        ] },
    ],
  },
  {
    id: "01040214",
    name: "טורי פורייה והתמרות אינטגרליות",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-13",
    examB: "2026-08-13",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "13:30", endTime: "15:30", building: "אמדו", room: "233", instructor: "ד\"ר יוחאי מעין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "310", instructor: "גב' מרינה גרוזד" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "308", instructor: "מר יורם יחיא" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "08:30", endTime: "09:30", building: "אולמן", room: "310", instructor: "גב' רבקה אביטל" },
        ] },
    ],
  },
  {
    id: "01040215",
    name: "פונקציות מרוכבות א'",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-16",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "סגו", room: "1", instructor: "ד\"ר יוחאי מעין" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "אמדו", room: "233", instructor: "ד\"ר דניאל רבייב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "301", instructor: "ד\"ר מרינה קרוש-ברם" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "201", instructor: "ד\"ר מרינה קרוש-ברם" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 1, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "301", instructor: "מר יורם יחיא" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 3, startTime: "08:30", endTime: "09:30", building: "אולמן", room: "301", instructor: "מר יורם יחיא" },
        ] },
    ],
  },
  {
    id: "01040220",
    name: "משוואות דפרנציאליות חלקיות ת'",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-08-04",
    examB: "2026-08-28",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "תחנה לחקר בניה", room: "1", instructor: "ד\"ר שלומי גובר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "302", instructor: "גב' מרינה גרוזד" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "17:30", endTime: "18:30", building: "אולמן", room: "201", instructor: "ד\"ר מרינה קרוש-ברם" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "310", instructor: "גב' מרינה גרוזד" },
        ] },
    ],
  },
  {
    id: "01040222",
    name: "תורת ההסתברות",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-08-02",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "103", instructor: "פרופ' אור משה שליט" },
          { day: 2, startTime: "11:30", endTime: "13:30", building: "אולמן", room: "103", instructor: "פרופ' אור משה שליט" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "102", instructor: "תום ווקנין" },
        ] },
    ],
  },
  {
    id: "01040228",
    name: "משוואות דיפרנציאליות חלקיות מ'",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-08-06",
    examB: "2026-08-31",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "306", instructor: "ד\"ר מרינה קרוש-ברם" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "601", instructor: "ד\"ר שלומי גובר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "310", instructor: "גב' מרינה גרוזד" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "303", instructor: "גב' מרינה גרוזד" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "101", instructor: "ד\"ר רועי בר און" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "501", instructor: "מר עבד אלחמיד דראושה" },
        ] },
    ],
  },
  {
    id: "01040253",
    name: "חידות ומתמטיקה 2",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "14:30", endTime: "16:30", building: "אמדו", room: "719", instructor: "פרופ' רום פנחסי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "16:30", endTime: "17:30", building: "אמדו", room: "719", instructor: "פרופ' רום פנחסי" },
        ] },
    ],
  },
  {
    id: "01040273",
    name: "מבוא לאנליזה פונק. ואנליזת פורייה",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-29",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "13:30", endTime: "15:30", building: "אולמן", room: "103", instructor: "פרופ' אור משה שליט" },
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "103", instructor: "פרופ' אור משה שליט" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "103", instructor: "מר רן קירי" },
        ] },
    ],
  },
  {
    id: "01040274",
    name: "תורת השדות",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "15:30" },
        ] },
    ],
  },
  {
    id: "01040279",
    name: "מבוא לחוגים ושדות",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-24",
    examB: "2026-08-21",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "707", instructor: "פרופ' מיכאל אנטוב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "707", instructor: "מר עומר שמחי" },
        ] },
    ],
  },
  {
    id: "01040280",
    name: "מודולים, חוגים וחבורות",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-24",
    examB: "2026-08-21",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "15:30", building: "אולמן", room: "702", instructor: "פרופ\"ח צבי יעקב נואר" },
        ] },
    ],
  },
  {
    id: "01040281",
    name: "חשבון אינפי 2",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-20",
    examB: "2026-08-20",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אמדו", room: "232", instructor: "פרופ' רוס פינסקי" },
          { day: 0, startTime: "12:30", endTime: "14:30", building: "אמדו", room: "232", instructor: "פרופ' רוס פינסקי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "506", instructor: "ד\"ר מיכל עמיר" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "אולמן", room: "305", instructor: "מר יואב סנדנר" },
        ] },
    ],
  },
  {
    id: "01040285",
    name: "משוואות דיפרנציאליות רגילות א'",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-30",
    examB: "2026-08-25",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "707", instructor: "ד\"ר לידיה פרס הרי" },
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "707", instructor: "ד\"ר לידיה פרס הרי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "305", instructor: "גב' יוליה פייגין-קצוב" },
        ] },
    ],
  },
  {
    id: "01040286",
    name: "קומבינטוריקה",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-29",
    examB: "2026-08-27",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "308", instructor: "ד\"ר חיים אבן זוהר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "308", instructor: "מר עומר שגב" },
        ] },
    ],
  },
  {
    id: "01040291",
    name: "אלגוריתמים קומבינטוריים",
    credit: 3.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-13",
    examB: "2026-08-12",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "13:30", building: "אולמן", room: "201", instructor: "ד\"ר אלן יאיר לאו" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "503", instructor: "מר יורם יחיא" },
        ] },
    ],
  },
  {
    id: "01040293",
    name: "תורת הקבוצות",
    credit: 2.5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-21",
    examB: "2026-08-12",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "11:30", building: "אולמן", room: "704", instructor: "ד\"ר ארז נשרים" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "704", instructor: "מר הלל רז" },
        ] },
    ],
  },
  {
    id: "01040294",
    name: "מבוא לאנליזה נומרית",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01040295",
    name: "חשבון אינפיניטסימלי 3",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-26",
    examB: "2026-08-19",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "202", instructor: "פרופ' מיכאל פוליאק" },
          { day: 2, startTime: "13:30", endTime: "15:30", building: "אולמן", room: "201", instructor: "פרופ' מיכאל פוליאק" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "13:30", building: "אולמן", room: "507", instructor: "גב' ליטל שמן" },
        ] },
    ],
  },
  {
    id: "01040814",
    name: "מבוא למדעי המחשב מ'",
    credit: 4,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01040818",
    name: "ארגון ותכנות המחשב",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01040823",
    name: "מערכות הפעלה",
    credit: 4.5,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01040824",
    name: "מבוא לתכנות מערכות",
    credit: 4,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01040918",
    name: "מבני נתונים 1",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01040952",
    name: "מערכות ספרתיות ומבנה המחשב",
    credit: 5,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01060011",
    name: "פרויקטים מחקריים 1",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "seminar", lessons: [
          { day: 4, startTime: "13:30", endTime: "14:30", building: "אמדו", room: "509", instructor: "פרופ\"ח רם בנד" },
        ] },
    ],
  },
  {
    id: "01060017",
    name: "נושאים ברגולריות ושימושים",
    credit: 2,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "14:30", endTime: "16:30", building: "אמדו", room: "509", instructor: "פרופ\"ח אלדר פישר" },
        ] },
    ],
  },
  {
    id: "01060061",
    name: "יסודות מתמטיים של למידת מכונה",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-14",
    examB: "2026-08-20",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "09:30", endTime: "12:30", building: "אולמן", room: "703", instructor: "פרופ\"ח שי מורן" },
        ] },
    ],
  },
  {
    id: "01060101",
    name: "מבוא למכניקת זורמים",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "אמדו", room: "509", instructor: "פרופ' אהוד יריב" },
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אמדו", room: "509", instructor: "פרופ' אהוד יריב" },
        ] },
    ],
  },
  {
    id: "01060156",
    name: "לוגיקה מתמטית",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-28",
    examB: "2026-08-19",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "703", instructor: "ד\"ר יתיר בנארי הלוי" },
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "703", instructor: "ד\"ר יתיר בנארי הלוי" },
        ] },
    ],
  },
  {
    id: "01060306",
    name: "אלגבראות לי",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-19",
    examB: "2026-08-24",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "אמדו", room: "619", instructor: "פרופ\"ח מקסים גורביץ" },
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אמדו", room: "619", instructor: "פרופ\"ח מקסים גורביץ" },
        ] },
    ],
  },
  {
    id: "01060310",
    name: "נושאים נבחרים בחבורות לי ממשיות וייצוגיהן",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "14:30", endTime: "17:30", building: "אמדו", room: "617", instructor: "פרופ' סרגיי חורושקין" },
        ] },
    ],
  },
  {
    id: "01060381",
    name: "אלגברה מודרנית 2",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "15:30", building: "אמדו", room: "619", instructor: "פרופ' חן מאירי" },
        ] },
    ],
  },
  {
    id: "01060383",
    name: "טופולוגיה אלגברית",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-30",
    examB: "2026-08-23",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "16:30", endTime: "17:30", building: "אמדו", room: "619", instructor: "פרופ\"ח ניר לזרוביץ" },
          { day: 0, startTime: "10:30", endTime: "12:30", building: "אמדו", room: "619", instructor: "פרופ\"ח ניר לזרוביץ" },
        ] },
    ],
  },
  {
    id: "01060395",
    name: "תורת הפונקציות 2",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01060404",
    name: "סמינר באלגברה 1",
    credit: 2,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אמדו", room: "719", instructor: "ד\"ר ארז נשרים" },
        ] },
    ],
  },
  {
    id: "01060413",
    name: "משוואות דיפרנציאליות חלקיות",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "11:30", endTime: "13:30", building: "אמדו", room: "619", instructor: "פרופ' איתי שפריר" },
          { day: 0, startTime: "15:30", endTime: "16:30", building: "אמדו", room: "619", instructor: "פרופ' איתי שפריר" },
        ] },
    ],
  },
  {
    id: "01060429",
    name: "תהליכים סטוכסטיים",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "09:30", endTime: "10:30", building: "אמדו", room: "619", instructor: "פרופ\"ח רון רוזנטל" },
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אמדו", room: "619", instructor: "פרופ\"ח רון רוזנטל" },
        ] },
    ],
  },
  {
    id: "01060433",
    name: "נושאים באנליזה פונקציונלית",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "15:30", endTime: "18:30", building: "אמדו", room: "619", instructor: "פרופ' עמנואל מילמן" },
        ] },
    ],
  },
  {
    id: "01060702",
    name: "פרקים נבחרים באלגברה",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אמדו", room: "509", instructor: "פרופ\"ח שי הרן" },
          { day: 2, startTime: "17:30", endTime: "18:30", building: "אמדו", room: "509", instructor: "פרופ\"ח שי הרן" },
        ] },
    ],
  },
  {
    id: "01060705",
    name: "גאומטריה ללא חיבור",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אמדו", room: "617", instructor: "פרופ\"ח שי הרן" },
          { day: 2, startTime: "13:30", endTime: "14:30", building: "אמדו", room: "617", instructor: "פרופ\"ח שי הרן" },
        ] },
    ],
  },
  {
    id: "01060716",
    name: "פרקים נבחרים בקומבינטוריקה",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "אמדו", room: "814", instructor: "ד\"ר חיים אבן זוהר" },
          { day: 1, startTime: "17:30", endTime: "18:30", building: "אמדו", room: "814", instructor: "ד\"ר חיים אבן זוהר" },
        ] },
    ],
  },
  {
    id: "01060800",
    name: "נושאים בתורה הארגודית",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "11:30", endTime: "14:30", building: "אמדו", room: "719", instructor: "פרופ\"ח איליה גכטמן" },
        ] },
    ],
  },
  {
    id: "01060802",
    name: "נושאים בתורת ההצגות",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01060941",
    name: "סמינר באנליזה",
    credit: 2,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "אמדו", room: "509", instructor: "ד\"ר אריאל רפפורט" },
        ] },
    ],
  },
  {
    id: "01060942",
    name: "אנליזה פונקציונלית",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "01060944",
    name: "מתמטיקה קוונטית: היסודות והמידע",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "13:30", endTime: "16:30", building: "אמדו", room: "619", instructor: "פרופ' גלעד גור" },
        ] },
    ],
  },
  {
    id: "01960012",
    name: "שיטות אנליטיות במיש. דיפ.",
    credit: 4,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-26",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "13:30", endTime: "15:30", building: "אולמן", room: "102", instructor: "ד\"ר לידיה פרס הרי" },
          { day: 2, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "102", instructor: "ד\"ר לידיה פרס הרי" },
        ] },
    ],
  },
  {
    id: "01960014",
    name: "למידה עמוקה ותורת הקירובים",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-16",
    examB: "2026-08-13",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "601", instructor: "ד\"ר נדב אליעזר דים" },
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "507", instructor: "ד\"ר נדב אליעזר דים" },
        ] },
    ],
  },
  {
    id: "01960017",
    name: "נושאים בלמידה עמוקה על גרפים",
    credit: 3,
    faculty: "הפקולטה למתמטיקה",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "17:30", building: "אמדו", room: "719", instructor: "ד\"ר רון לוי" },
        ] },
    ],
  },
  {
    id: "01980000",
    name: "שיטות אסימפטוטיות",
    credit: 4,
    faculty: "הפקולטה למתמטיקה",
    examA: "2026-07-21",
    examB: "2026-08-16",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "אמדו", room: "719", instructor: "פרופ' אהוד יריב" },
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אמדו", room: "719", instructor: "פרופ' אהוד יריב" },
        ] },
    ],
  },
  {
    id: "02340114",
    name: "מבוא למדעי המחשב מ'",
    credit: 4,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-03",
    examB: "2026-08-28",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "גב' יעל ארז, פרופ' מירלה בן-חן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "607" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "607" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "604" },
        ] },
    ],
  },
  {
    id: "02340117",
    name: "מבוא למדעי המחשב ח'",
    credit: 4,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-03",
    examB: "2026-08-28",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "גב' יעל ארז, פרופ' מירלה בן-חן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "אמדו", room: "234" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "אמדו", room: "231" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "504" },
        ] },
    ],
  },
  {
    id: "02340118",
    name: "ארגון ותכנות המחשב",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-04",
    examB: "2026-08-27",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "09:30", endTime: "11:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "ד\"ר חסן עבאסי" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אמדו", room: "233", instructor: "מר בעז מואב" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "306" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "310" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "09:30", endTime: "10:30", building: "טאוב- מדמ\"ח", room: "5" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "604" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "306" },
        ] },
    ],
  },
  {
    id: "02340123",
    name: "מערכות הפעלה",
    credit: 4.5,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-21",
    examB: "2026-08-16",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "פרופ' דן צפריר" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "מר לאוניד רסקין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "606" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "506" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "703" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "302" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "803" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "607" },
        ] },
      { id: "25", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "אולמן", room: "306" },
        ] },
    ],
  },
  {
    id: "02340124",
    name: "מבוא לתכנות מערכות",
    credit: 4,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-24",
    examB: "2026-08-24",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "ד\"ר גל ללוש" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "ד\"ר יוסף ויינשטיין" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "308" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "606" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "601" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "802" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "308" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "507" },
        ] },
    ],
  },
  {
    id: "02340125",
    name: "אלגוריתמים נומריים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-02",
    examB: "2026-08-28",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "פרופ\"ח יניב רומנו" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "ד\"ר יעל ינקלבסקי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "507" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "703" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "303" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "503" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "701" },
        ] },
    ],
  },
  {
    id: "02340128",
    name: "מבוא למחשב שפת פייתון",
    credit: 4,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-07",
    examB: "2026-08-30",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "ד\"ר ילנה נופברי" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "9", instructor: "ד\"ר ילנה נופברי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "אמדו", room: "234" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "7" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "ליידי דייוס - מכונות", room: "640" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "306" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "אולמן", room: "305" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "אולמן", room: "305" },
        ] },
      { id: "24", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "305" },
        ] },
    ],
  },
  {
    id: "02340129",
    name: "מב.לתורת הקבוצות ואוטומטים למדמ\"ח",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-29",
    examB: "2026-08-25",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "תחנה לחקר בניה", room: "1", instructor: "ד\"ר שרי שינולד" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "7", instructor: "שונית אגמון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "08:30", endTime: "10:30", building: "אמדו", room: "234" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "08:30", endTime: "10:30", building: "אמדו", room: "231" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "אמדו", room: "233" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "803" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "אמדו", room: "231" },
        ] },
    ],
  },
  {
    id: "02340130",
    name: "מבוא למחשב שפת פייתון - בל",
    credit: 4,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "87", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "104", instructor: "ד\"ר יוסף ויינשטיין" },
        ] },
      { id: "87", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "אולמן", room: "104", instructor: "מר אברהם טל" },
        ] },
    ],
  },
  {
    id: "02340141",
    name: "קומבינטוריקה למדעי המחשב",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-29",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "פרופ' איתן יעקובי" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "16:30", endTime: "18:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "ד\"ר אריה לב זבוקריצקי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "708" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "310" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 1, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "303" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 4, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "803" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "507" },
        ] },
    ],
  },
  {
    id: "02340218",
    name: "מבני נתונים 1",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-17",
    examB: "2026-08-21",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "9", instructor: "פרופ' ארז פטרנק" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "9", instructor: "ד\"ר נחשון כהן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "טאוב- מדמ\"ח", room: "6" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "303" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "305" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 0, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "708" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 4, startTime: "09:30", endTime: "10:30", building: "אולמן", room: "604" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "טאוב- מדמ\"ח", room: "5" },
        ] },
    ],
  },
  {
    id: "02340247",
    name: "אלגוריתמים 1",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-13",
    examB: "2026-08-12",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "פרופ' יוסף נאור" },
        ] },
      { id: "20", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "9", instructor: "פרופ\"ח רועי שורץ" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "טאוב- מדמ\"ח", room: "9" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "302" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "606" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "305" },
        ] },
      { id: "22", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "805" },
        ] },
      { id: "23", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "607" },
        ] },
      { id: "24", type: "tutorial", lessons: [
          { day: 2, startTime: "11:30", endTime: "12:30", building: "אולמן", room: "305" },
        ] },
    ],
  },
  {
    id: "02340268",
    name: "מבני נתונים ואלגוריתמים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-15",
    examB: "2026-08-16",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "11:30", endTime: "13:30", building: "טאוב- מדמ\"ח", room: "8", instructor: "ד\"ר שרי שינולד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "11:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "5" },
        ] },
    ],
  },
  {
    id: "02340290",
    name: "פרויקט 1 במדעי המחשב",
    credit: 0.5,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "69", type: "tutorial", lessons: [
          { day: 0, startTime: "10:00", endTime: "11:00" },
        ] },
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "02340291",
    name: "פרויקט 2 במדעי המחשב",
    credit: 1,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "77", type: "tutorial", lessons: [
          { day: 1, startTime: "16:00", endTime: "17:00" },
        ] },
    ],
  },
  {
    id: "02340292",
    name: "לוגיקה למדעי המחשב",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-26",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "ד\"ר שרי שינולד" },
        ] },
      { id: "21", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "ד\"ר יקיר ויזל" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "09:30", endTime: "10:30", building: "טאוב- מדמ\"ח", room: "6" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "603" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "13:30", building: "טאוב- מדמ\"ח", room: "5" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "703" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "307" },
        ] },
    ],
  },
  {
    id: "02340312",
    name: "פרויקט שנתי בהנדסת תוכנה-שלב ב'",
    credit: 3.5,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "08:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "9", instructor: "מר איתי דברן" },
        ] },
    ],
  },
  {
    id: "02340901",
    name: "סדנה בתכנות תחרותי",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "16:30", endTime: "19:30", building: "טאוב- מדמ\"ח", room: "7", instructor: "פרופ' גיל ברקת" },
        ] },
    ],
  },
  {
    id: "02360001",
    name: "מבוא למחקר פקולטי במדעי המחשב",
    credit: 1,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "16:30", endTime: "18:30", building: "טאוב- מדמ\"ח", room: "4", instructor: "פרופ\"ח אורן זלצמן" },
        ] },
    ],
  },
  {
    id: "02360010",
    name: "נושאים בסמינר לניהול נתונים אחראי",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "3", instructor: "ד\"ר ברית יונגמן" },
        ] },
    ],
  },
  {
    id: "02360011",
    name: "נושאים באלגוריתמים לגרפים דינמיים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "3", instructor: "ד\"ר דוד וייץ" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "טאוב- מדמ\"ח", room: "3" },
        ] },
    ],
  },
  {
    id: "02360012",
    name: "נושאים במערכות מקביליות ומובזרות",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "4", instructor: "ד\"ר נעמה בן דוד" },
        ] },
    ],
  },
  {
    id: "02360013",
    name: "נושאים נבחרים במיטוב ביצועים מערכות",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-21",
    examB: "2026-08-19",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "15:30", endTime: "17:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "ד\"ר נדב עמית" },
        ] },
    ],
  },
  {
    id: "02360016",
    name: "נושאים באלגוריתמים לאופטימיזציה",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "פרופ\"ח רועי שורץ" },
        ] },
    ],
  },
  {
    id: "02360020",
    name: "נושאים ברשתות חברתיות: אלגוריתמים ושימושיהם",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-21",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "9", instructor: "ד\"ר עומרי בן אליעזר" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "13:30", building: "טאוב- מדמ\"ח", room: "9" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "13:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "7" },
        ] },
    ],
  },
  {
    id: "02360025",
    name: "אוטומטים, לוגיקה ומשחקים",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-04",
    examB: "2026-08-27",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "פרופ\"ח שאול אלמגור" },
        ] },
    ],
  },
  {
    id: "02360267",
    name: "מבנה מחשבים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-05",
    examB: "2026-08-31",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "16:30", endTime: "18:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "ד\"ר נדב עמית" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "16:30", endTime: "17:30", building: "אולמן", room: "310" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "308" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "306" },
        ] },
    ],
  },
  {
    id: "02360271",
    name: "פיתוח מבוסס אנדרואיד",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-26",
    examB: "2026-08-18",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "4", instructor: "פרופ' ערן יהב, מר עידו רם" },
        ] },
    ],
  },
  {
    id: "02360272",
    name: "פרויקט פיתוח מבוסס אנדרואיד",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "seminar", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "4", instructor: "מר עידו רם" },
        ] },
    ],
  },
  {
    id: "02360319",
    name: "שפות תכנות",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-30",
    examB: "2026-08-25",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "10:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "פרופ\"ח דוד לורנץ" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "3" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "5" },
        ] },
    ],
  },
  {
    id: "02360330",
    name: "מבוא לאופטימיזציה",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-21",
    examB: "2026-08-20",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "16:30", endTime: "18:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "ד\"ר מיכאל ציבולבסקי" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "11:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "7", instructor: "מר רועי וליץ" },
        ] },
    ],
  },
  {
    id: "02360332",
    name: "האינטרנט של הדברים - טכנולוגיות ויישומים",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-14",
    examB: "2026-08-17",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "מר איתי דברן" },
        ] },
    ],
  },
  {
    id: "02360333",
    name: "פרויקט באינטרנט של הדברים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "seminar", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "מר איתי דברן" },
        ] },
    ],
  },
  {
    id: "02360341",
    name: "תקשורת באינטרנט",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-15",
    examB: "2026-08-26",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "פרופ' ראובן כהן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "09:30", endTime: "10:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "מר ערן תבור" },
        ] },
    ],
  },
  {
    id: "02360343",
    name: "תורת החישוביות",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-17",
    examB: "2026-08-23",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "ד\"ר גד אלכסנדרוביץ" },
        ] },
      { id: "21", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "306" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "310" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "302" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "708" },
        ] },
      { id: "21", type: "tutorial", lessons: [
          { day: 4, startTime: "09:30", endTime: "10:30" },
        ] },
    ],
  },
  {
    id: "02360350",
    name: "הגנה ברשתות",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-21",
    examB: "2026-08-17",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "2", instructor: "ד\"ר יניב (משה) דוד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "305" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "701" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 0, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "504" },
        ] },
    ],
  },
  {
    id: "02360363",
    name: "מסדי נתונים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-30",
    examB: "2026-08-25",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "7", instructor: "ד\"ר ברית יונגמן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "503" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "10:30", endTime: "11:30", building: "אולמן", room: "504" },
        ] },
    ],
  },
  {
    id: "02360371",
    name: "פרויקט בתכנות מקבילי ומבוזר",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "7", instructor: "פרופ' רועי פרידמן" },
        ] },
    ],
  },
  {
    id: "02360377",
    name: "אלגוריתמים מבוזרים בגרפים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "פרופ' קרן הלל צנזור" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "טאוב- מדמ\"ח", room: "7", instructor: "מר תומר אבן" },
        ] },
    ],
  },
  {
    id: "02360496",
    name: "הנדסה לאחור",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-13",
    examB: "2026-08-12",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "7", instructor: "מר עמר קדמיאל" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "12:30", endTime: "13:30", building: "טאוב- מדמ\"ח", room: "7" },
        ] },
    ],
  },
  {
    id: "02360501",
    name: "מבוא לבינה מלאכותית",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-28",
    examB: "2026-08-27",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "10:30", endTime: "12:30", building: "סגו", room: "1", instructor: "ד\"ר שרה  (אייזנשטיין) קרן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "12:30", endTime: "13:30", building: "אולמן", room: "501" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 1, startTime: "15:30", endTime: "16:30", building: "אולמן", room: "303" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 2, startTime: "13:30", endTime: "14:30", building: "אולמן", room: "504" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "אולמן", room: "603" },
        ] },
    ],
  },
  {
    id: "02360509",
    name: "נושאים מתקדמים במבנה מחשבים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "15:30", endTime: "17:30", building: "טאוב- מדמ\"ח", room: "8", instructor: "פרופ' אברהם מנדלסון" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 0, startTime: "17:30", endTime: "18:30", building: "טאוב- מדמ\"ח", room: "8" },
        ] },
    ],
  },
  {
    id: "02360518",
    name: "סיבוכיות תקשורת",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "פרופ\"ח יובל פילמוס" },
        ] },
    ],
  },
  {
    id: "02360520",
    name: "קידוד במערכות אחסון-מידע",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "4", instructor: "פרופ' רוני רוט" },
        ] },
    ],
  },
  {
    id: "02360603",
    name: "נושאים מתקדמים במדעי המחשב 3",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-14",
    examB: "2026-08-12",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "201", instructor: "פרופ\"ח יוסף גיל" },
        ] },
    ],
  },
  {
    id: "02360605",
    name: "נושאים מתקדמים במדעי המחשב 5",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "9", instructor: "פרופ' בני קימלפלד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "טאוב- מדמ\"ח", room: "3" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "11:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "מר בועז ברגר" },
        ] },
    ],
  },
  {
    id: "02360606",
    name: "נושאים מתקדמים במדעי המחשב 6",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-05",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "13:00", endTime: "15:00", building: "טאוב- מדמ\"ח", room: "8", instructor: "ד\"ר סטפנו רקנאטזי" },
        ] },
    ],
  },
  {
    id: "02360624",
    name: "נושאים מתקדמים בשיטות אימות פורמליות ה'",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "ד\"ר יקיר ויזל" },
        ] },
    ],
  },
  {
    id: "02360628",
    name: "נושאים מתקדמים בגרפיקה ממוחשבת ה'",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "401", instructor: "פרופ' מירלה בן-חן" },
        ] },
    ],
  },
  {
    id: "02360629",
    name: "נושאים מתקדמים בגרפיקה ממוחשבת ה'+ת'",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "08:30", endTime: "11:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "פרופ' גרשון אלבר" },
        ] },
    ],
  },
  {
    id: "02360641",
    name: "נושאים מתקדמים באינפורמציה קוונטית ה'+ת'",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 4, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "5", instructor: "פרופ' טל מור" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 4, startTime: "13:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "5" },
        ] },
    ],
  },
  {
    id: "02360755",
    name: "אלגוריתמים מבוזרים",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 0, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "4", instructor: "פרופ' חגית עטיה" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "15:30", building: "טאוב- מדמ\"ח", room: "8", instructor: "גב' הדר מטלו" },
        ] },
    ],
  },
  {
    id: "02360765",
    name: "תכנון ולמידת חיזוק במערכות AI",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-28",
    examB: "2026-08-18",
    groups: [
      { id: "11", type: "lecture", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "ד\"ר שרה  (אייזנשטיין) קרן" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 3, startTime: "16:30", endTime: "17:30", building: "טאוב- מדמ\"ח", room: "6" },
        ] },
    ],
  },
  {
    id: "02360766",
    name: "מבוא ללמידת מכונה",
    credit: 3.5,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-07-28",
    examB: "2026-08-21",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "1", instructor: "ד\"ר ניר רוזנפלד" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 2, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "6" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 3, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "3" },
        ] },
      { id: "13", type: "tutorial", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "אולמן", room: "601" },
        ] },
      { id: "14", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "16:30", building: "טאוב- מדמ\"ח", room: "5" },
        ] },
    ],
  },
  {
    id: "02360801",
    name: "סמינר במדעי המחשב 1",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "15:30", endTime: "17:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "פרופ' נאדר בשותי" },
        ] },
    ],
  },
  {
    id: "02360802",
    name: "סמינר במדעי המחשב 2",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 0, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "3", instructor: "פרופ' איתן יעקובי" },
        ] },
    ],
  },
  {
    id: "02360803",
    name: "סמינר במדעי המחשב 3",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30" },
        ] },
    ],
  },
  {
    id: "02360804",
    name: "סמינר במדעי המחשב 4",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "15:30", endTime: "17:30", building: "טאוב- מדמ\"ח", room: "3", instructor: "ד\"ר הילה פלג" },
        ] },
    ],
  },
  {
    id: "02360805",
    name: "סמינר במדעי המחשב 5",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 3, startTime: "16:00", endTime: "18:00", building: "טאוב- מדמ\"ח", room: "8", instructor: "ד\"ר אביעד צוק" },
        ] },
    ],
  },
  {
    id: "02360806",
    name: "סמינר במדעי המחשב 6",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "פרופסור אמריטוס אורנה גרימברג" },
        ] },
    ],
  },
  {
    id: "02360807",
    name: "סמינר במדעי מחשב 7",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 2, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "6", instructor: "ד\"ר עודד שטיין" },
        ] },
    ],
  },
  {
    id: "02360813",
    name: "סמינר באלגוריתמים",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "3", instructor: "ד\"ר דוד וייץ" },
        ] },
    ],
  },
  {
    id: "02360832",
    name: "סמינר בתכנות מקבילי",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 4, startTime: "10:30", endTime: "12:30", building: "טאוב- מדמ\"ח", room: "4", instructor: "פרופ' ארז פטרנק" },
        ] },
    ],
  },
  {
    id: "02360839",
    name: "סמינר במערכות לומדות וכשלונותיהן",
    credit: 2,
    faculty: "הפקולטה למדעי המחשב",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "13:30", endTime: "15:30", building: "טאוב- מדמ\"ח", room: "4", instructor: "ד\"ר ניר רוזנפלד" },
        ] },
    ],
  },
  {
    id: "02360873",
    name: "ראיה ממוחשבת",
    credit: 3,
    faculty: "הפקולטה למדעי המחשב",
    examA: "2026-08-02",
    examB: "2026-08-26",
    groups: [
      { id: "10", type: "lecture", lessons: [
          { day: 1, startTime: "12:30", endTime: "14:30", building: "טאוב- מדמ\"ח", room: "7", instructor: "ד\"ר אור ליטני" },
        ] },
      { id: "11", type: "tutorial", lessons: [
          { day: 1, startTime: "14:30", endTime: "15:30", building: "טאוב- מדמ\"ח", room: "7" },
        ] },
      { id: "12", type: "tutorial", lessons: [
          { day: 2, startTime: "10:00", endTime: "11:00", building: "טאוב- מדמ\"ח", room: "7" },
        ] },
    ],
  }
];
