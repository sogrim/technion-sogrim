export const validCourseNumber = (courseNumber: string) => {
  return /^\d+$/.test(courseNumber) && courseNumber.length === 6;
};

export const validCourseCredit = (credit: string | number) => {
  const isNumberOrFloat = Number(credit);
  return (
    isNumberOrFloat === 0 ||
    !!(isNumberOrFloat && +credit >= 0 && (+credit * 2) % 1 === 0)
  );
};
