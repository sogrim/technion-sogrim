import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TooltipContentProps = React.ComponentProps<typeof TooltipContent>;

export interface HintProps {
  /** Tooltip text. If empty/nullish, children render with no tooltip. */
  label: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipContentProps["side"];
  align?: TooltipContentProps["align"];
  className?: string;
}

/** How long a tapped hint stays up before hiding itself. */
const TOUCH_AUTO_HIDE_MS = 2500;

const noop = () => {};

/** True when the primary pointer can't hover — phones and tablets. */
function useCoarsePointer(): boolean {
  const query = "(hover: none)";
  const [coarse, setCoarse] = React.useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(query);
    setCoarse(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return coarse;
}

/**
 * Hover hint built on the app Tooltip primitive. Use this instead of the
 * native `title` attribute, which is unstyled and only appears after a
 * multi-second browser delay. Relies on the app-root <TooltipProvider/>.
 *
 * The single child becomes the trigger (via `asChild`), so it must be one
 * element that forwards a ref and props (a DOM element or a component that
 * spreads props onto one).
 *
 * On touch devices there is no hover, and Radix tooltips never open from a
 * tap, so the hint would be unreachable. There we drive `open` ourselves: a
 * tap shows the hint (the child's own onClick still runs), and it hides on
 * the next tap, on scroll, or after a short timeout.
 */
export function Hint({ label, children, side = "top", align, className }: HintProps) {
  const isTouch = useCoarsePointer();
  const [touchOpen, setTouchOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isTouch || !touchOpen) return;
    const close = () => setTouchOpen(false);
    // Registered after the tap that opened the hint, so it only reacts to the next one.
    const timer = window.setTimeout(close, TOUCH_AUTO_HIDE_MS);
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("scroll", close, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("scroll", close, true);
    };
  }, [isTouch, touchOpen]);

  if (label === null || label === undefined || label === "") {
    return <>{children}</>;
  }

  const content = (
    <TooltipContent
      side={side}
      align={align}
      className={cn(
        "max-w-xs text-right",
        isTouch && "pointer-events-none",
        className,
      )}
    >
      {label}
    </TooltipContent>
  );

  if (isTouch) {
    return (
      // Radix's own open/close requests are ignored here — a tap fires both
      // pointerdown and click, and Radix closes on each, which would undo the
      // open we just asked for.
      <Tooltip open={touchOpen} onOpenChange={noop}>
        <TooltipTrigger asChild onClick={() => setTouchOpen(true)}>
          {children}
        </TooltipTrigger>
        {content}
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {content}
    </Tooltip>
  );
}
