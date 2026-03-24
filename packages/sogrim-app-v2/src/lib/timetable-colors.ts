/**
 * 10 course colors in OKLCH, designed for both light and dark modes.
 * Each course gets a deterministic color based on its index in the draft.
 */

interface CourseColor {
  bg: string;
  bgDark: string;
  text: string;
  textDark: string;
  border: string;
  borderDark: string;
}

const COURSE_COLORS: CourseColor[] = [
  {
    bg: "oklch(0.75 0.14 250)",
    bgDark: "oklch(0.40 0.14 250)",
    text: "#fff",
    textDark: "#e8edf5",
    border: "oklch(0.65 0.14 250)",
    borderDark: "oklch(0.50 0.14 250)",
  },
  {
    bg: "oklch(0.72 0.16 300)",
    bgDark: "oklch(0.38 0.14 300)",
    text: "#fff",
    textDark: "#ede8f5",
    border: "oklch(0.62 0.16 300)",
    borderDark: "oklch(0.48 0.14 300)",
  },
  {
    bg: "oklch(0.78 0.12 170)",
    bgDark: "oklch(0.40 0.10 170)",
    text: "#fff",
    textDark: "#e0f0ec",
    border: "oklch(0.68 0.12 170)",
    borderDark: "oklch(0.50 0.10 170)",
  },
  {
    bg: "oklch(0.78 0.14 55)",
    bgDark: "oklch(0.42 0.12 55)",
    text: "#fff",
    textDark: "#f5ede0",
    border: "oklch(0.68 0.14 55)",
    borderDark: "oklch(0.52 0.12 55)",
  },
  {
    bg: "oklch(0.72 0.16 350)",
    bgDark: "oklch(0.38 0.14 350)",
    text: "#fff",
    textDark: "#f5e0e8",
    border: "oklch(0.62 0.16 350)",
    borderDark: "oklch(0.48 0.14 350)",
  },
  {
    bg: "oklch(0.75 0.14 145)",
    bgDark: "oklch(0.38 0.12 145)",
    text: "#fff",
    textDark: "#e0f0e4",
    border: "oklch(0.65 0.14 145)",
    borderDark: "oklch(0.48 0.12 145)",
  },
  {
    bg: "oklch(0.78 0.14 85)",
    bgDark: "oklch(0.42 0.12 85)",
    text: "#fff",
    textDark: "#f0ede0",
    border: "oklch(0.68 0.14 85)",
    borderDark: "oklch(0.52 0.12 85)",
  },
  {
    bg: "oklch(0.68 0.16 275)",
    bgDark: "oklch(0.36 0.14 275)",
    text: "#fff",
    textDark: "#e0e4f5",
    border: "oklch(0.58 0.16 275)",
    borderDark: "oklch(0.46 0.14 275)",
  },
  {
    bg: "oklch(0.72 0.18 15)",
    bgDark: "oklch(0.38 0.14 15)",
    text: "#fff",
    textDark: "#f5e4e0",
    border: "oklch(0.62 0.18 15)",
    borderDark: "oklch(0.48 0.14 15)",
  },
  {
    bg: "oklch(0.78 0.10 200)",
    bgDark: "oklch(0.40 0.10 200)",
    text: "#fff",
    textDark: "#e0ecf0",
    border: "oklch(0.68 0.10 200)",
    borderDark: "oklch(0.50 0.10 200)",
  },
];

export function getCourseColor(colorIndex: number): CourseColor {
  return COURSE_COLORS[colorIndex % COURSE_COLORS.length];
}

export function getCourseColorCount(): number {
  return COURSE_COLORS.length;
}

/**
 * Get CSS custom properties for a course color.
 * Use with style={{ ...getCourseColorVars(index) }} on the course block.
 */
export function getCourseColorVars(
  colorIndex: number,
  isDark: boolean,
): React.CSSProperties {
  const color = getCourseColor(colorIndex);
  return {
    "--course-bg": isDark ? color.bgDark : color.bg,
    "--course-text": isDark ? color.textDark : color.text,
    "--course-border": isDark ? color.borderDark : color.border,
  } as React.CSSProperties;
}
