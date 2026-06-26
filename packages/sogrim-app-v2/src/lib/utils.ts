import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Decide whether a dropdown / suggestion list anchored to `anchor` should open
 * upward instead of downward, because there isn't enough room below it in the
 * viewport. Prevents a long list from spilling past the bottom of the page and
 * adding an outer page scrollbar.
 */
export function computeDropUp(anchor: HTMLElement | null, itemCount: number): boolean {
  if (!anchor || itemCount === 0) return false
  const rect = anchor.getBoundingClientRect()
  // Rows are ~36px and lists are capped around 12rem (≈192px), plus a small margin.
  const estimatedHeight = Math.min(itemCount * 36, 192) + 8
  const spaceBelow = window.innerHeight - rect.bottom
  return spaceBelow < estimatedHeight && rect.top > spaceBelow
}
