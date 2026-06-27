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

/**
 * Hover hint built on the app Tooltip primitive. Use this instead of the
 * native `title` attribute, which is unstyled and only appears after a
 * multi-second browser delay. Relies on the app-root <TooltipProvider/>.
 *
 * The single child becomes the trigger (via `asChild`), so it must be one
 * element that forwards a ref and props (a DOM element or a component that
 * spreads props onto one).
 */
export function Hint({ label, children, side = "top", align, className }: HintProps) {
  if (label === null || label === undefined || label === "") {
    return <>{children}</>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={cn("max-w-xs text-right", className)}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
