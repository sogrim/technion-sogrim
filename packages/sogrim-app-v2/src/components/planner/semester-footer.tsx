import { useMemo } from "react";
import type { RowData } from "@/types/domain";

interface SemesterFooterProps {
  rows: RowData[];
}

export function SemesterFooter({ rows }: SemesterFooterProps) {
  const { avg, doneCredit, totalCredit } = useMemo(() => {
    let sum = 0;
    let doneCredit = 0;
    let doneCreditNoExemption = 0;
    let totalCredit = 0;

    for (const row of rows) {
      const credit = typeof row.credit === "string" ? parseFloat(row.credit) : row.credit;
      if (isNaN(credit)) continue;

      totalCredit += credit;
      const courseGrade = row.grade ? Number(row.grade) : null;

      if (courseGrade === 0 || (courseGrade !== null && !isNaN(courseGrade))) {
        sum += courseGrade * credit;
        doneCredit += credit;
        doneCreditNoExemption += credit;
      }

      if (row.grade === "עבר" || row.grade === "פטור עם ניקוד") {
        doneCredit += credit;
      }
    }

    const avg =
      doneCreditNoExemption !== 0
        ? Math.round((sum / doneCreditNoExemption + Number.EPSILON) * 10) / 10
        : "-";

    return {
      avg,
      doneCredit: doneCreditNoExemption !== 0 ? doneCredit : "-",
      totalCredit,
    };
  }, [rows]);

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted border border-t-0 rounded-b-lg text-sm text-muted-foreground">
      <span>ממוצע סמסטר: {avg}</span>
      <span className="text-border">{"•"}</span>
      <span>נק״ז ששובצו: {totalCredit}</span>
      <span className="text-border">{"•"}</span>
      <span>נק״ז שבוצעו: {doneCredit}</span>
    </div>
  );
}
