import type { CSSProperties } from "react";
import iconInk from "@/assets/logo-icon-ink.png";
import iconAccent from "@/assets/logo-icon-accent.png";
import horizontalInk from "@/assets/logo-horizontal-ink.png";
import horizontalAccent from "@/assets/logo-horizontal-accent.png";
import stackedInk from "@/assets/logo-stacked-ink.png";
import stackedAccent from "@/assets/logo-stacked-accent.png";
import { cn } from "@/lib/utils";

/** `icon` = mark only (tight spaces, favicon-like slots), `horizontal` = mark +
 *  wordmark side by side (wide, short slots), `stacked` = mark above wordmark
 *  (narrow or centred slots). */
const VARIANTS = {
  icon: { ink: iconInk, accent: iconAccent, ratio: "512 / 497" },
  horizontal: { ink: horizontalInk, accent: horizontalAccent, ratio: "1165 / 425" },
  stacked: { ink: stackedInk, accent: stackedAccent, ratio: "1017 / 813" },
} as const;

interface LogoProps {
  variant?: keyof typeof VARIANTS;
  className?: string;
}

function maskLayer(src: string): CSSProperties {
  return {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
}

/** The artwork ships as two alpha masks — the ink layer and the accent layer
 *  (the checkmark, the dot on the "i" and the separators between the Hebrew
 *  words). Each is painted with a theme token instead of a baked-in colour, so
 *  the mark follows both light/dark and the active palette.
 *
 *  Callers size the logo by height (`h-9 w-auto`); `aspect-ratio` derives the
 *  width, since the mask layers are absolutely positioned and so contribute no
 *  intrinsic size. */
export function Logo({ variant = "horizontal", className }: LogoProps) {
  const { ink, accent, ratio } = VARIANTS[variant];

  return (
    <span
      role="img"
      aria-label="סוגרים"
      className={cn("relative inline-block", className)}
      style={{ aspectRatio: ratio }}
    >
      <span aria-hidden className="absolute inset-0 bg-foreground" style={maskLayer(ink)} />
      <span aria-hidden className="absolute inset-0 bg-logo-accent" style={maskLayer(accent)} />
    </span>
  );
}
