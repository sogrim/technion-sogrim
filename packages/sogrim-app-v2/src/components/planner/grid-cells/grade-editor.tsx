import { useState, useRef, useEffect, useCallback } from "react";
import type { CustomCellEditorProps } from "ag-grid-react";
import { COURSE_GRADE_OPTIONS } from "@/types/domain";
import type { RowData } from "@/types/domain";

const EXEMPTION_OPTIONS = COURSE_GRADE_OPTIONS.filter((opt) =>
  opt.includes("פטור")
);

interface GradeEditorParams {
  isSemester0: boolean;
}

export function GradeEditor(
  props: CustomCellEditorProps<RowData, string> & GradeEditorParams
) {
  const { value, onValueChange, stopEditing, isSemester0 } = props;

  const isSpecialGrade = (v: string | undefined | null): boolean =>
    !!v && COURSE_GRADE_OPTIONS.includes(v as (typeof COURSE_GRADE_OPTIONS)[number]);

  const [isNumeric, setIsNumeric] = useState(() => {
    if (isSemester0) return false;
    return !isSpecialGrade(value);
  });

  const [numVal, setNumVal] = useState(() => {
    const n = parseInt(value ?? "", 10);
    return !isNaN(n) ? String(n) : "";
  });

  const [selVal, setSelVal] = useState(() =>
    isSpecialGrade(value) ? (value ?? "") : ""
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isNumeric) inputRef.current?.focus();
      else selectRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [isNumeric]);

  const onNum = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setNumVal(raw);
      if (raw === "") {
        onValueChange(undefined);
      } else {
        const n = parseInt(raw, 10);
        if (!isNaN(n) && n >= 0 && n <= 100) onValueChange(String(n));
      }
    },
    [onValueChange]
  );

  const onSel = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      setSelVal(v);
      onValueChange(v || undefined);
      if (v) setTimeout(() => stopEditing(), 0);
    },
    [onValueChange, stopEditing]
  );

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsNumeric((prev) => {
        if (prev) {
          setNumVal("");
          setSelVal("");
          onValueChange(undefined);
        } else {
          setSelVal("");
          setNumVal("");
          onValueChange(undefined);
        }
        return !prev;
      });
    },
    [onValueChange]
  );

  const opts = isSemester0 ? EXEMPTION_OPTIONS : COURSE_GRADE_OPTIONS;

  // Semester 0: exemption dropdown only, no toggle
  if (isSemester0) {
    return (
      <div className="flex items-center h-full px-2 bg-card">
        <select
          ref={selectRef}
          value={selVal}
          onChange={onSel}
          className="w-full h-7 px-1 text-sm border border-border rounded bg-card focus:outline-none focus:border-blue-400"
        >
          <option value="">--</option>
          {opts.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  // Regular semester: single row [input/select] [label]
  return (
    <div className="flex items-center h-full gap-1.5 px-2 bg-card w-[200px]">
      {/* Input or select */}
      {isNumeric ? (
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={100}
          value={numVal}
          onChange={onNum}
          onKeyDown={(e) => { if (e.key === "Enter") stopEditing(); }}
          placeholder="0-100"
          className="flex-1 min-w-0 h-7 px-1 text-sm text-center border border-border rounded bg-card focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <select
          ref={selectRef}
          value={selVal}
          onChange={onSel}
          className="flex-1 min-w-0 h-7 px-1 text-sm border border-border rounded bg-card focus:outline-none focus:border-blue-400"
        >
          <option value="">--</option>
          {opts.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}

      {/* Toggle label */}
      <button
        type="button"
        onMouseDown={toggle}
        className="shrink-0 text-[11px] text-blue-500 hover:text-blue-700 hover:underline whitespace-nowrap"
      >
        {isNumeric ? "ציון לא מספרי" : "ציון מספרי"}
      </button>
    </div>
  );
}
