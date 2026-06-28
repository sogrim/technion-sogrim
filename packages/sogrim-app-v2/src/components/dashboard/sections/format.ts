/** Shared formatting + tooltip helpers for the dashboard sections. Keeping
 *  these out of the component files lets the section components stay
 *  fast-refresh friendly. */

/** Localized integer (he-IL grouping). */
export function num(value: number): string {
  return Math.round(value).toLocaleString("he-IL");
}

/** A fraction in [0, 1] -> a rounded percent string like "42%". */
export function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** A 0..1 fraction of `whole` rendered as a percent of the population. */
export function shareOf(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return pct(part / whole);
}
