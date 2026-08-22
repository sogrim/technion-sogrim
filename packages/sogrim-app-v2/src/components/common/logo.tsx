import iconOnLight from "@/assets/logo-icon.png";
import iconOnDark from "@/assets/logo-icon-light.png";
import horizontalOnLight from "@/assets/logo-horizontal.png";
import horizontalOnDark from "@/assets/logo-horizontal-light.png";
import stackedOnLight from "@/assets/logo-stacked.png";
import stackedOnDark from "@/assets/logo-stacked-light.png";
import { cn } from "@/lib/utils";

/** `icon` = mark only (tight spaces, favicon-like slots), `horizontal` = mark +
 *  wordmark side by side (wide, short slots), `stacked` = mark above wordmark
 *  (narrow or centred slots). */
const VARIANTS = {
  icon: { onLight: iconOnLight, onDark: iconOnDark },
  horizontal: { onLight: horizontalOnLight, onDark: horizontalOnDark },
  stacked: { onLight: stackedOnLight, onDark: stackedOnDark },
} as const;

interface LogoProps {
  variant?: keyof typeof VARIANTS;
  className?: string;
}

/** The artwork is raster with baked-in ink colour, so we ship a dark-ink and a
 *  light-ink copy and let CSS pick one. Both are rendered; the inactive one is
 *  `display:none`, so it stays out of flex/grid layout. */
export function Logo({ variant = "horizontal", className }: LogoProps) {
  const { onLight, onDark } = VARIANTS[variant];

  return (
    <>
      <img src={onLight} alt="סוגרים" className={cn("dark:hidden", className)} />
      <img src={onDark} alt="" aria-hidden className={cn("hidden dark:block", className)} />
    </>
  );
}
