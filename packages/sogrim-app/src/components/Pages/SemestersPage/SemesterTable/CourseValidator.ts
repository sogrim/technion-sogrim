import { courseGradeOptions, emptyRow, RowData } from "./SemesterTabsConsts";

const validCourseNumber = (courseNumber: string) => {
  return /^\d+$/.test(courseNumber) && courseNumber.length === 6;
};

const validCourseCredit = (credit: string | number) => {
  const isNumberOrFloat = Number(credit);
  return (
    isNumberOrFloat === 0 ||
    !!(isNumberOrFloat && +credit >= 0 && (+credit * 2) % 1 === 0)
  );
};

const validGrade = (grade: any) => {
  const gradeNumber = Number(grade);
  if (grade === "") {
    return true;
  }
  if (isNaN(grade)) {
    if (courseGradeOptions.indexOf(grade) > -1) {
      return true;
    } else {
      return false;
    }
  } else if (
    gradeNumber &&
    gradeNumber % 1 === 0 &&
    gradeNumber >= 0 &&
    gradeNumber <= 100
  ) {
    return true;
  }
  return false;
};

export interface courseFromUserValidationsValue {
  error: boolean;
  newRowData: RowData;
  msg: string;
}
export const courseFromUserValidations = (
  course: RowData,
  semesterRows: RowData[]
): courseFromUserValidationsValue => {
  if (!validCourseNumber(course.courseNumber)) {
    return {
      error: true,
      newRowData: emptyRow,
      msg: "מספר הקורס שהכנסת לא תקין. מספר קורס מכיל 6 ספרות בלבד.",
    };
  }
  if (!validCourseCredit(course.credit)) {
    return {
      error: true,
      newRowData: emptyRow,
      msg: "נק״ז חייב להיות מספר גדול שווה מאפס, ובקפיצות של 0.5",
    };
  }
  if (!validGrade(course.grade)) {
    return {
      error: true,
      newRowData: emptyRow,
      msg: "ציון חייב להיות מספר בין 0 ל-100 או אחת מהאופציות הלא מספריות (עבר, נכשל, לא השלים)",
    };
  }

  let newState = "לא הושלם";
  let newGrade = course.grade === "" ? null : course.grade;
  if (
    course.grade &&
    (course.grade === "עבר" ||
      course.grade === "פטור ללא ניקוד" ||
      course.grade === "פטור עם ניקוד" ||
      +course.grade >= 55)
  ) {
    newState = "הושלם";
  }
  const fixedNewRowData: RowData = {
    name: course.name,
    courseNumber: course.courseNumber,
    semester: course.semester,
    credit: course.credit,
    state: newState,
    type: course.type,
    grade: newGrade,
  };

  return {
    error: false,
    newRowData: fixedNewRowData,
    msg: "",
  };
};
