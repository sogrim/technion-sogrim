import type { RowData } from "@/types/domain";

const COURSE_NUMBER_REGEX = /^\d{6}$|^\d{8}$/;
const PASS_GRADES = ["עבר", "פטור ללא ניקוד", "פטור עם ניקוד"];
const FAIL_GRADES = ["נכשל", "לא השלים"];

interface ValidationResult {
  error: boolean;
  msg: string;
  newRowData: RowData;
}

export function validateCourseNumber(courseNumber: string): string | null {
  if (!COURSE_NUMBER_REGEX.test(courseNumber)) {
    return "מספר קורס חייב להיות 6 או 8 ספרות";
  }
  return null;
}

export function validateCredit(credit: string | number): string | null {
  const num = typeof credit === "string" ? parseFloat(credit) : credit;
  if (isNaN(num) || num < 0) {
    return "נקודות זכות חייבות להיות מספר חיובי";
  }
  if ((num * 2) % 1 !== 0) {
    return "נקודות זכות חייבות להיות בכפולות של 0.5";
  }
  return null;
}

export function validateGrade(grade: string | undefined): string | null {
  if (!grade || grade === "-") return null;
  if (PASS_GRADES.includes(grade) || FAIL_GRADES.includes(grade)) return null;
  const num = parseInt(grade, 10);
  if (isNaN(num) || num < 0 || num > 100) {
    return "ציון חייב להיות בין 0 ל-100 או ערך מיוחד";
  }
  return null;
}

export function determineState(grade: string | undefined): string {
  if (!grade || grade === "-") return "בתהליך";
  if (PASS_GRADES.includes(grade)) return "הושלם";
  if (FAIL_GRADES.includes(grade)) return "לא הושלם";
  const num = parseInt(grade, 10);
  if (!isNaN(num)) {
    return num >= 55 ? "הושלם" : "לא הושלם";
  }
  return "בתהליך";
}

export function courseFromUserValidations(
  row: RowData,
  existingRows: RowData[],
  isNew = false
): ValidationResult {
  // Validate course number
  const courseNumErr = validateCourseNumber(row.courseNumber);
  if (courseNumErr) {
    return { error: true, msg: courseNumErr, newRowData: row };
  }

  // Check uniqueness for new courses
  if (isNew && existingRows.some((r) => r.courseNumber === row.courseNumber)) {
    return { error: true, msg: "קורס זה כבר קיים בסמסטר", newRowData: row };
  }

  // Validate credit
  const creditErr = validateCredit(row.credit);
  if (creditErr) {
    return { error: true, msg: creditErr, newRowData: row };
  }

  // Validate grade
  const gradeErr = validateGrade(row.grade);
  if (gradeErr) {
    return { error: true, msg: gradeErr, newRowData: row };
  }

  // Auto-determine state from grade
  const state = determineState(row.grade);

  return {
    error: false,
    msg: "",
    newRowData: { ...row, state },
  };
}
