import { APP_VERSION } from "@/lib/app-version";

interface ReleaseNotes {
  version: string;
  changes: readonly string[];
}

export const CURRENT_RELEASE: ReleaseNotes = {
  version: APP_VERSION,
  changes: ["הוספת כל המסלולים של הפקולטה לביולוגיה."],
};

export const RELEASE_HISTORY: readonly ReleaseNotes[] = [
  CURRENT_RELEASE,
  {
    version: "2.0.0",
    changes: [
      "ממשק חדש לסוגרים! ומלא פיצ'רים חדשים כולל:",
      '1. תמיכה בנק"ז מילואים.',
      "2. הוספת כל המסלולים של הפקולטה להנדסת חשמל.",
      "3. בניית מערכת שעות.",
    ],
  },
];
