export type VersionChanges = {
  version: string;
  changes: string[];
};

export const versionChanges: VersionChanges[] = [
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
