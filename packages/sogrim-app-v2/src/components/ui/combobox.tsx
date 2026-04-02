import { useState, useRef, useEffect } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "./command";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "בחר...",
  searchPlaceholder = "חיפוש...",
  emptyMessage = "לא נמצאו תוצאות",
  disabled = false,
  className,
  id,
}: ComboboxProps) {
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

  // Group options if any have a group field
  const hasGroups = options.some((o) => o.group);
  const groups: Map<string, ComboboxOption[]> = new Map();
  if (hasGroups) {
    for (const opt of options) {
      const g = opt.group || "";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(opt);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)} id={id}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {hasGroups ? (
                Array.from(groups.entries()).map(([group, opts]) => (
                  <CommandGroup key={group} heading={group || undefined}>
                    {opts.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={`${opt.label} ${opt.value}`}
                        onSelect={() => {
                          onChange(opt.value);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            opt.value === value ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              ) : (
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={`${opt.label} ${opt.value}`}
                      onSelect={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          opt.value === value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
