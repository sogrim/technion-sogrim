import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "--",
  disabled = false,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded-md border border-input bg-card px-2 py-1 text-sm",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[120px] max-h-[200px] overflow-y-auto rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-2 py-1.5 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "transition-colors cursor-pointer",
                opt.value === value && "bg-accent/50",
              )}
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  opt.value === value ? "opacity-100" : "opacity-0",
                )}
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
