export type VersionChanges = {
  version: string;
  changes: string[];
};

export const versionChanges: VersionChanges[] = [
  {
    version: "v1.1.2",
    changes: [
      'תוקן באג שבו לחלק מהסטודנטים הנק"ז של הקורסים היה שגוי לאחר העתקה מגיליון הציונים',
    ],
  },
  {
    version: "v1.1.1",
    changes: [
      "נוספו כל הקטלוגים ממסלול הנדסת נתונים ומידע מ3 השנים האחרונות",
      "תוקן באג שהתרחש בעת העתקת גליון הציונים מדפדפן Microsoft Edge",
    ],
  },
  {
    version: "v1.1.0",
    changes: [
      "נוסף קטלוג מהפקולטה לתעשייה וניהול - הנדסת נתונים ומידע 2019-2020",
      "נוספו קטלוגים מהפקולטה למדעי המחשב - 2022-2023",
      "תוקנו מספר באגים ושופרו ביצועי חישוב סטטוס התואר",
      "נוספו אלפי קורסים למאגר",
    ],
  },
  {
    version: "v1.0.5",
    changes: [
      'התחשב בקורסים בתהליך: נוסף כפתור המאפשר לכם לחשב את סטטוס התואר שלכם עם התחשבות בקורסים שעוד אין להם ציון (קורסים עם סטטוס "בתהליך")',
    ],
  },
  {
    version: "v1.0.4",
    changes: [
      "לרשימת המסלולים נוסף המסלול הארבע שנתי!",
      "תוקן באג שבו לפעמים מחיקת קורס גרמה למחיקה של הקורס הלא נכון.",
      "סגירת התואר היא כעת יותר.. חגיגית ;)",
    ],
  },
  {
    version: "v1.0.3",
    changes: ["ניתן כעת לייצא את נתוני התואר לקובץ להורדה."],
  },
  {
    version: "v1.0.2",
    changes: ["תוקן באג שהתרחש בעת הוספת קורס חובה וסימונו כלא רלוונטי."],
  },
  {
    version: "v1.0.1",
    changes: [
      "ניתן כעת לחפש קורסים לפי מספר או שם הקורס, בעת הוספת קורס חדש.",
      "תוקנו כמה באגים בלשונית הסמסטרים (חישוב ממוצע סמסטריאלי, מיון קורסים לפי ציון, תצוגה של קורסים ללא ציון).",
    ],
  },
  {
    version: "v1.0.0",
    changes: ["יצאנו לדרך! 🎉🎉🎉"],
  },
];
