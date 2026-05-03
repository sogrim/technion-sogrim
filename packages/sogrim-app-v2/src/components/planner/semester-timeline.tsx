import { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  useDraggable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

type Season = "winter" | "spring" | "summer";

interface RealSemester {
  year: number;
  season: Season;
  idx: number;
}

interface OrdinalSlot {
  kind: "ordinal";
  id: string;
  ordinalIdx: number;
  name: string;
  season: Season;
  real: RealSemester;
  isPadding: false;
}

interface EmptySlot {
  kind: "empty";
  id: string;
  real: RealSemester;
  annotation?: string;
  /** Outside the core chip range — rendered dim with no affordance */
  isPadding: boolean;
}

type Slot = OrdinalSlot | EmptySlot;

interface TimelineState {
  positions: number[];
  annotations: Record<number, string>;
}

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const SEASON_HE: Record<Season, string> = {
  winter: "חורף",
  spring: "אביב",
  summer: "קיץ",
};

/** Colors rendered as an inline strip so they show in both light and dark modes. */
const SEASON_STRIP: Record<Season, string> = {
  winter: "bg-sky-500",
  spring: "bg-emerald-500",
  summer: "bg-amber-500",
};

const SLOT_WIDTH = 68;
const CHIP_HEIGHT = 60;
/** 1 academic year of padding before first chip and after last chip (3 slots = 1 year) */
const PADDING_SLOTS = 3;

const GAP_PRESETS = ["מילואים", "חופשה", "חילופי סטודנטים", "אחר"] as const;
const STATE_KEY = "sogrim-timeline-v2";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function parseOrdinal(name: string | undefined | null): { season: Season; num: number } | null {
  if (!name || typeof name !== "string") return null;
  const parts = name.split("_");
  if (parts.length < 2) return null;
  const num = parseInt(parts[1], 10);
  if (isNaN(num)) return null;
  const season: Season | null =
    parts[0] === "חורף" ? "winter"
    : parts[0] === "אביב" ? "spring"
    : parts[0] === "קיץ" ? "summer"
    : null;
  return season ? { season, num } : null;
}

const SEASON_HE_NAME: Record<Season, string> = {
  winter: "חורף",
  spring: "אביב",
  summer: "קיץ",
};

/**
 * Assign canonical, monotonic ordinal names to a calendar-ordered list of
 * seasons. Non-summer slots increment a counter; summer reuses the preceding
 * non-summer's counter so it shares the degree-year number.
 */
function canonicalSemesterNames(seasons: Season[]): string[] {
  const result: string[] = [];
  let counter = 0;
  for (const s of seasons) {
    if (s === "summer") {
      result.push(`${SEASON_HE_NAME.summer}_${counter > 0 ? counter : 1}`);
    } else {
      counter++;
      result.push(`${SEASON_HE_NAME[s]}_${counter}`);
    }
  }
  return result;
}

/**
 * Plan an insertion at slotRealIdx with the given season, including any
 * renumbering renames required to keep the ordinal sequence canonical and
 * sort-aligned with calendar order.
 */
function computeAddInsertion(
  ordinals: string[],
  positions: number[],
  slotRealIdx: number,
  season: Season,
): { newName: string; renames: Record<string, string> } {
  let k = positions.findIndex((p) => p > slotRealIdx);
  if (k < 0) k = positions.length;

  const seasons: Season[] = [];
  for (let i = 0; i < ordinals.length; i++) {
    if (i === k) seasons.push(season);
    const parsed = parseOrdinal(ordinals[i]);
    if (parsed) seasons.push(parsed.season);
  }
  if (k === ordinals.length) seasons.push(season);

  const canonical = canonicalSemesterNames(seasons);
  const newName = canonical[k];

  const renames: Record<string, string> = {};
  for (let i = 0; i < ordinals.length; i++) {
    const ci = i < k ? i : i + 1;
    if (ordinals[i] !== canonical[ci]) {
      renames[ordinals[i]] = canonical[ci];
    }
  }
  return { newName, renames };
}

function toLinearIdx(year: number, season: Season): number {
  return year * 3 + (season === "winter" ? 0 : season === "spring" ? 1 : 2);
}

function fromLinearIdx(idx: number): { year: number; season: Season } {
  const year = Math.floor(idx / 3);
  const rem = ((idx % 3) + 3) % 3;
  const season: Season = rem === 0 ? "winter" : rem === 1 ? "spring" : "summer";
  return { year, season };
}

function formatSlotTitle(real: RealSemester): string {
  if (real.season === "winter") return `${SEASON_HE.winter} ${real.year}-${real.year + 1}`;
  return `${SEASON_HE[real.season]} ${real.year + 1}`;
}

function defaultPositions(ordinalNames: string[], startYear: number): number[] {
  const out: number[] = [];
  let cursor = toLinearIdx(startYear, "winter");
  for (const name of ordinalNames) {
    const p = parseOrdinal(name);
    if (!p) continue;
    while (fromLinearIdx(cursor).season !== p.season) cursor++;
    out.push(cursor);
    cursor++;
  }
  return out;
}

function reconcile(saved: TimelineState, ordinals: string[]): TimelineState {
  const defaultStart = new Date().getFullYear() - 2;
  if (saved.positions.length !== ordinals.length) {
    const first = saved.positions[0];
    const startYear = first !== undefined ? fromLinearIdx(first).year : defaultStart;
    return { ...saved, positions: defaultPositions(ordinals, startYear) };
  }
  for (let i = 1; i < saved.positions.length; i++) {
    if (saved.positions[i] <= saved.positions[i - 1]) {
      return { ...saved, positions: defaultPositions(ordinals, defaultStart) };
    }
  }
  return saved;
}

function loadState(ordinals: string[]): TimelineState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.positions) && typeof p.annotations === "object") {
        return reconcile(p, ordinals);
      }
    }
  } catch {}
  return reconcile({ positions: [], annotations: {} }, ordinals);
}

function saveState(s: TimelineState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {}
}

/** Build all slots in display range. Always includes summer — uniform calendar grid. */
function buildSlots(
  positions: number[],
  annotations: Record<number, string>,
  ordinals: string[],
): { slots: Slot[]; coreStart: number; coreEnd: number } {
  if (positions.length === 0) return { slots: [], coreStart: 0, coreEnd: 0 };
  const positionByIdx = new Map<number, number>();
  positions.forEach((p, i) => positionByIdx.set(p, i));

  const annotatedKeys = Object.keys(annotations).map(Number);
  const firstPos = positions[0];
  const lastPos = positions[positions.length - 1];
  const minAnnotated = annotatedKeys.length ? Math.min(...annotatedKeys) : Infinity;
  const maxAnnotated = annotatedKeys.length ? Math.max(...annotatedKeys) : -Infinity;

  const coreStart = Math.min(firstPos, minAnnotated);
  const coreEnd = Math.max(lastPos, maxAnnotated);

  const startIdx = coreStart - PADDING_SLOTS;
  const endIdx = coreEnd + PADDING_SLOTS;

  const slots: Slot[] = [];
  for (let idx = startIdx; idx <= endIdx; idx++) {
    const { year, season } = fromLinearIdx(idx);
    const real: RealSemester = { year, season, idx };
    const ordinalIdx = positionByIdx.get(idx);
    const annotation = annotations[idx];
    const isPadding = idx < coreStart || idx > coreEnd;

    // Guard: ordinalIdx may reference a stale index when ordinals prop shrinks
    // (e.g. during the render right after deletion, before reconcile runs).
    // In that case, treat the slot as empty so we don't crash on undefined.
    const ordinalName =
      ordinalIdx !== undefined && ordinalIdx < ordinals.length
        ? ordinals[ordinalIdx]
        : undefined;

    if (ordinalIdx !== undefined && ordinalName) {
      const parsed = parseOrdinal(ordinalName);
      slots.push({
        kind: "ordinal",
        id: `ord-${ordinalIdx}`,
        ordinalIdx,
        name: ordinalName,
        season: parsed?.season ?? season,
        real,
        isPadding: false,
      });
    } else {
      slots.push({ kind: "empty", id: `empty-${idx}`, real, annotation, isPadding });
    }
  }
  return { slots, coreStart, coreEnd };
}

// ────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────

interface SemesterTimelineProps {
  ordinals: string[];
  currentOrdinalIdx: number;
  onSelectOrdinal: (idx: number) => void;
  /**
   * Add a semester with the given canonical name. `renames` (oldName → newName)
   * lists existing semesters that must be renamed atomically with the add to
   * keep ordinal numbers monotonic with calendar order.
   */
  onAddSemester?: (name: string, renames: Record<string, string>) => void;
  /**
   * Delete the semester by name. `renames` lists any remaining semesters that
   * must be renamed atomically to keep ordinal numbers monotonic with calendar
   * order after the deletion.
   */
  onDeleteSemester?: (name: string, renames: Record<string, string>) => void;
  className?: string;
}

// ────────────────────────────────────────────────────────────────
// OrdinalChip
// ────────────────────────────────────────────────────────────────

function OrdinalChip({
  slot,
  isActive,
  followOffsetX,
  onSelect,
  onDelete,
}: {
  slot: OrdinalSlot;
  isActive: boolean;
  /** Snapped translate for chips following a drag. */
  followOffsetX?: number;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  const draggable = useDraggable({
    id: slot.id,
    data: { ordinalIdx: slot.ordinalIdx },
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [confirmPos, setConfirmPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!confirmOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(t) &&
        buttonRef.current && !buttonRef.current.contains(t)
      ) {
        setConfirmOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setConfirmOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [confirmOpen]);

  useLayoutEffect(() => {
    if (!confirmOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const POPOVER_H = 76;
    const POPOVER_W = 150;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < POPOVER_H + 8
      ? rect.top - POPOVER_H - 6
      : rect.bottom + 6;
    const left = Math.max(8, Math.min(window.innerWidth - POPOVER_W - 8, rect.left + rect.width / 2 - POPOVER_W / 2));
    setConfirmPos({ top, left });
  }, [confirmOpen]);

  // Magnetic snap for the active chip — visually jumps between year boundaries
  // so the user sees discrete 1-year steps instead of a continuous slide.
  let snappedActiveX: number | undefined;
  if (draggable.isDragging) {
    const raw = draggable.transform?.x ?? 0;
    const years = Math.round(raw / (3 * SLOT_WIDTH));
    snappedActiveX = years * 3 * SLOT_WIDTH;
  }

  const effectiveX =
    snappedActiveX !== undefined ? snappedActiveX : followOffsetX ?? 0;

  const parsed = parseOrdinal(slot.name);
  const num = parsed?.num ?? slot.ordinalIdx + 1;

  return (
    <button
      ref={draggable.setNodeRef}
      {...draggable.listeners}
      {...draggable.attributes}
      onClick={(e) => {
        if (!draggable.isDragging) {
          e.stopPropagation();
          onSelect();
        }
      }}
      style={{
        transform: effectiveX ? `translate3d(${effectiveX}px, 0, 0)` : undefined,
        transition: draggable.isDragging || followOffsetX !== undefined
          ? "transform 120ms cubic-bezier(0.25, 1, 0.4, 1)"
          : undefined,
        zIndex: draggable.isDragging ? 30 : followOffsetX ? 10 : 1,
        willChange: draggable.isDragging || followOffsetX ? "transform" : undefined,
      }}
      title={formatSlotTitle(slot.real)}
      className={cn(
        "group relative h-full w-full rounded-md border overflow-hidden",
        "flex flex-col items-center justify-center gap-0.5",
        "cursor-grab active:cursor-grabbing select-none",
        "shadow-sm",
        isActive
          ? "bg-muted border-foreground/70 shadow-[0_0_0_1px] shadow-foreground/20"
          : "bg-card border-border hover:bg-muted/60 transition-colors",
        draggable.isDragging && "shadow-lg ring-1 ring-foreground/30",
      )}
    >
      {/* Season accent strip — always on the logical start (right in RTL) */}
      <div
        className={cn(
          "absolute top-0 bottom-0 start-0 w-[3px]",
          SEASON_STRIP[slot.season],
        )}
        aria-hidden
      />
      <span className="text-lg font-semibold tabular-nums leading-none text-foreground">
        {num}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {SEASON_HE[slot.season]}
      </span>

      {/* Delete affordance — small × in the far corner, shown on hover */}
      {onDelete && (
        <div
          ref={buttonRef}
          role="button"
          tabIndex={-1}
          aria-label="מחק סמסטר"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-0.5 end-0.5 flex items-center justify-center",
            "h-4 w-4 rounded-sm cursor-pointer",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            "opacity-0 group-hover:opacity-100 transition-opacity",
          )}
        >
          <X className="h-3 w-3" />
        </div>
      )}

      {/* Confirmation popover */}
      {confirmOpen && confirmPos && typeof document !== "undefined" && createPortal(
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.96, y: 2 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className={cn(
            "fixed z-[70] rounded-md border border-border bg-popover shadow-lg",
            "w-[150px] p-2 flex flex-col gap-1.5",
          )}
          style={{ top: confirmPos.top, left: confirmPos.left }}
          dir="rtl"
        >
          <div className="text-[11px] text-foreground text-center">
            למחוק סמסטר {num}?
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(false);
                onDelete?.();
              }}
              className="flex-1 text-[11px] py-1 rounded bg-destructive/90 hover:bg-destructive text-destructive-foreground"
            >
              כן
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(false);
              }}
              className="flex-1 text-[11px] py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
            >
              לא
            </button>
          </div>
        </motion.div>,
        document.body,
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────
// EmptySlotView
// ────────────────────────────────────────────────────────────────

function EmptySlotView({
  slot,
  canAdd,
  isGhost,
  isPrimaryNext,
  onAddSemester,
  onAddAnnotation,
  onRemoveAnnotation,
}: {
  slot: EmptySlot;
  /** Whether this slot can host a new semester (drives the "+" affordance) */
  canAdd: boolean;
  /** Render with always-visible ghost styling vs subtle hover-only padding */
  isGhost: boolean;
  /** First non-summer slot past the latest chip — gets prominent "next semester" treatment */
  isPrimaryNext: boolean;
  onAddSemester?: () => void;
  onAddAnnotation: (label: string) => void;
  onRemoveAnnotation: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; placement: "top" | "bottom" } | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // Close on escape or scroll
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    const onScroll = () => setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menuOpen]);

  // Position the menu relative to the viewport — flip up if not enough space below
  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const MENU_H = 152; // approx max height of the menu (4 items + header)
    const MENU_W = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placement = spaceBelow < MENU_H && spaceAbove > spaceBelow ? "top" : "bottom";
    const top = placement === "bottom" ? rect.bottom + 4 : rect.top - MENU_H - 4;
    // Anchor to right edge of trigger (RTL)
    const left = Math.max(8, Math.min(window.innerWidth - MENU_W - 8, rect.right - MENU_W));
    setMenuPos({ top, left, placement });
  }, [menuOpen]);

  if (slot.annotation) {
    return (
      <div
        className={cn(
          "group relative h-full w-full rounded-md overflow-hidden",
          "border border-amber-500/40",
          "bg-[repeating-linear-gradient(45deg,rgba(245,158,11,0.09)_0,rgba(245,158,11,0.09)_5px,transparent_5px,transparent_10px)]",
          "dark:bg-[repeating-linear-gradient(45deg,rgba(245,158,11,0.18)_0,rgba(245,158,11,0.18)_5px,transparent_5px,transparent_10px)]",
          "flex items-center justify-center",
        )}
        title={`${slot.annotation} · ${formatSlotTitle(slot.real)}`}
      >
        <span className="text-[10px] text-amber-700 dark:text-amber-400 px-1 text-center font-medium">
          {slot.annotation}
        </span>
        <button
          onClick={onRemoveAnnotation}
          className={cn(
            "absolute top-0.5 end-0.5 opacity-0 group-hover:opacity-100",
            "transition-opacity flex items-center justify-center",
            "h-4 w-4 rounded bg-amber-500/20 hover:bg-amber-500/40",
            "text-amber-700 dark:text-amber-400",
          )}
          aria-label="הסר תיוג"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    );
  }

  if (!canAdd) {
    return <div className="h-full w-full" />;
  }

  // Summer empty slots in core: less prominent (still interactive)
  const isSummer = slot.real.season === "summer";

  return (
    <div className="group relative h-full w-full">
      <button
        ref={triggerRef}
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          "relative h-full w-full rounded-md overflow-hidden",
          "flex flex-col items-center justify-center gap-0.5",
          "border border-dashed transition-all cursor-pointer",
          isPrimaryNext
            ? "border-foreground/35 bg-foreground/[0.04] hover:bg-foreground/10 hover:border-foreground/55 shadow-[0_0_0_1px] shadow-foreground/5"
            : isGhost
              ? isSummer
                ? "border-border/40 bg-muted/10 hover:bg-muted/30 hover:border-foreground/40 opacity-60 hover:opacity-100"
                : "border-foreground/15 bg-muted/15 hover:bg-muted/40 hover:border-foreground/40"
              : "border-border/25 hover:border-foreground/30",
        )}
        title={
          isPrimaryNext
            ? `הוסף סמסטר · ${formatSlotTitle(slot.real)}`
            : formatSlotTitle(slot.real)
        }
      >
        {isGhost && (
          <div
            className={cn(
              "absolute top-0 bottom-0 start-0 w-[3px] transition-opacity",
              isPrimaryNext
                ? "opacity-60 group-hover:opacity-90"
                : "opacity-25 group-hover:opacity-50",
              SEASON_STRIP[slot.real.season],
            )}
            aria-hidden
          />
        )}
        {isPrimaryNext ? (
          <>
            <Plus className="h-4 w-4 text-foreground/70 group-hover:text-foreground transition-colors" />
            <span className="text-[10px] font-medium text-foreground/70 group-hover:text-foreground transition-colors leading-tight">
              סמסטר חדש
            </span>
          </>
        ) : isGhost ? (
          <>
            <Plus className="h-4 w-4 text-foreground/35 group-hover:text-foreground/70 transition-colors" />
            <span className="text-[10px] text-muted-foreground/70 group-hover:text-foreground/70 transition-colors">
              {SEASON_HE[slot.real.season]}
            </span>
          </>
        ) : (
          <Plus className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-80 transition-opacity" />
        )}
      </button>
      {menuOpen && menuPos && typeof document !== "undefined" && createPortal(
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: menuPos.placement === "bottom" ? -2 : 2, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.08 }}
          className={cn(
            "fixed z-[70] rounded-md border border-border bg-popover shadow-lg",
            "min-w-[160px] overflow-hidden",
          )}
          style={{ top: menuPos.top, left: menuPos.left }}
          dir="rtl"
        >
          {canAdd && onAddSemester && (
            <>
              <div className="px-2 py-1 text-[10px] text-muted-foreground border-b border-border/50">
                הוסף סמסטר
              </div>
              <button
                onClick={() => {
                  onAddSemester();
                  setMenuOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-1.5 text-start text-xs font-medium",
                  "hover:bg-muted transition-colors",
                )}
              >
                + {SEASON_HE[slot.real.season]} {slot.real.season === "winter"
                  ? `${slot.real.year}-${slot.real.year + 1}`
                  : slot.real.year + 1}
              </button>
              <div className="border-t border-border/50" />
            </>
          )}
          <div className="px-2 py-1 text-[10px] text-muted-foreground border-b border-border/50">
            תיוג הפסקה
          </div>
          {GAP_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                onAddAnnotation(preset);
                setMenuOpen(false);
              }}
              className={cn(
                "block w-full px-3 py-1.5 text-start text-xs",
                "hover:bg-muted transition-colors",
              )}
            >
              {preset}
            </button>
          ))}
        </motion.div>,
        document.body,
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────

export function SemesterTimeline({
  ordinals,
  currentOrdinalIdx,
  onSelectOrdinal,
  onAddSemester,
  onDeleteSemester,
  className,
}: SemesterTimelineProps) {
  const [state, setState] = useState<TimelineState>(() => loadState(ordinals));
  const [drag, setDrag] = useState<{ ordinalIdx: number; deltaX: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ start: false, end: false });
  const grabScrollRef = useRef<{ x: number; scrollLeft: number } | null>(null);

  /** Calendar idx to place the next added semester at — set right before calling
      onAddSemester so the new chip lands exactly where the user clicked. */
  const pendingAddPositionRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  // Sync positions with ordinals length changes (parent adds/removes semesters).
  // Uses pendingAddPositionRef to place newly-added semesters where the user clicked.
  // Inserts at the correct calendar-order index (not just append), so middle-gap
  // adds keep positions[] monotonic and aligned with the parent's sorted ordinals.
  useEffect(() => {
    setState((s) => {
      if (ordinals.length > s.positions.length && pendingAddPositionRef.current !== null) {
        const pos = pendingAddPositionRef.current;
        pendingAddPositionRef.current = null;
        let k = s.positions.findIndex((p) => p > pos);
        if (k < 0) k = s.positions.length;
        const newPositions = [
          ...s.positions.slice(0, k),
          pos,
          ...s.positions.slice(k),
        ];
        for (let i = 1; i < newPositions.length; i++) {
          if (newPositions[i] <= newPositions[i - 1]) {
            return reconcile(s, ordinals); // shouldn't happen, but be safe
          }
        }
        return { ...s, positions: newPositions };
      }
      return reconcile(s, ordinals);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordinals.length]);

  const handleAddSemesterAtSlot = useCallback(
    (slotRealIdx: number, season: Season) => {
      if (!onAddSemester) return;
      const { newName, renames } = computeAddInsertion(
        ordinals,
        state.positions,
        slotRealIdx,
        season,
      );
      pendingAddPositionRef.current = slotRealIdx;
      onAddSemester(newName, renames);
    },
    [onAddSemester, ordinals, state.positions],
  );

  const handleDeleteSemesterAt = useCallback(
    (ordinalIdx: number) => {
      if (!onDeleteSemester) return;
      const name = ordinals[ordinalIdx];
      if (!name) return;

      // Compute renumbered names for the remaining semesters in calendar order.
      const remainingSeasons: Season[] = [];
      const remainingNames: string[] = [];
      for (let i = 0; i < ordinals.length; i++) {
        if (i === ordinalIdx) continue;
        const parsed = parseOrdinal(ordinals[i]);
        if (parsed) {
          remainingSeasons.push(parsed.season);
          remainingNames.push(ordinals[i]);
        }
      }
      const canonical = canonicalSemesterNames(remainingSeasons);
      const renames: Record<string, string> = {};
      for (let i = 0; i < remainingNames.length; i++) {
        if (remainingNames[i] !== canonical[i]) {
          renames[remainingNames[i]] = canonical[i];
        }
      }

      // Pre-emptively drop the position so we don't render a stale index.
      setState((s) => ({
        ...s,
        positions: s.positions.filter((_, i) => i !== ordinalIdx),
      }));
      onDeleteSemester(name, renames);
    },
    [onDeleteSemester, ordinals],
  );

  useEffect(() => {
    saveState(state);
  }, [state]);

  const { slots, coreStart, coreEnd } = useMemo(
    () => buildSlots(state.positions, state.annotations, ordinals),
    [state.positions, state.annotations, ordinals],
  );

  const yearGroups = useMemo(() => {
    const g: Array<{ ac: number; startIdx: number; count: number; anyCore: boolean }> = [];
    slots.forEach((s, i) => {
      const ac = s.real.year + 1;
      const last = g[g.length - 1];
      const inCore = !s.isPadding;
      if (last && last.ac === ac) {
        last.count++;
        if (inCore) last.anyCore = true;
      } else {
        g.push({ ac, startIdx: i, count: 1, anyCore: inCore });
      }
    });
    return g;
  }, [slots]);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const idx = e.active.data.current?.ordinalIdx as number | undefined;
    if (idx === undefined) return;
    setDrag({ ordinalIdx: idx, deltaX: 0 });
  }, []);

  const handleDragMove = useCallback((e: DragMoveEvent) => {
    setDrag((d) => (d ? { ...d, deltaX: e.delta.x } : d));
  }, []);

  const handleDragEnd = useCallback((_e: DragEndEvent) => {
    if (drag) {
      // Snap to whole-year increments (3 calendar slots) so chip seasons stay valid.
      const rawSlotDelta = -drag.deltaX / SLOT_WIDTH;
      const deltaYears = Math.round(rawSlotDelta / 3);
      const deltaSlots = deltaYears * 3;
      if (deltaSlots !== 0) {
        const newPositions = state.positions.map((p, i) =>
          i >= drag.ordinalIdx ? p + deltaSlots : p,
        );
        let valid = true;
        for (let i = 1; i < newPositions.length; i++) {
          if (newPositions[i] <= newPositions[i - 1]) {
            valid = false;
            break;
          }
        }
        if (valid) {
          setState((s) => ({ ...s, positions: newPositions }));
        }
      }
    }
    setDrag(null);
  }, [drag, state.positions]);

  const handleDragCancel = useCallback(() => setDrag(null), []);

  // Track overflow state to show fade gradients on the sides that have more content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      // scrollLeft in RTL: browsers vary — use absolute comparisons
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 1) {
        setOverflow({ start: false, end: false });
        return;
      }
      // "start" in RTL = right side (reading start). In Chromium RTL, scrollLeft <= 0,
      // 0 = at start (right-most), -maxScroll = at end (left-most).
      const atStart = Math.abs(scrollLeft) < 2;
      const atEnd = Math.abs(Math.abs(scrollLeft) - maxScroll) < 2;
      setOverflow({ start: !atStart, end: !atEnd });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [slots.length]);

  // Grab-to-scroll on empty areas (ruler / year labels)
  const onGrabPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // Skip if the event originated from a chip / button — those have their own handlers
    if (target.closest("button") || target.closest("[role='button']")) return;
    if (!scrollRef.current) return;
    grabScrollRef.current = {
      x: e.clientX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
    scrollRef.current.style.cursor = "grabbing";
  };

  const onGrabPointerMove = (e: React.PointerEvent) => {
    if (!grabScrollRef.current || !scrollRef.current) return;
    const dx = e.clientX - grabScrollRef.current.x;
    scrollRef.current.scrollLeft = grabScrollRef.current.scrollLeft - dx;
  };

  const endGrabScroll = () => {
    grabScrollRef.current = null;
    if (scrollRef.current) scrollRef.current.style.cursor = "";
  };

  // Vertical wheel → horizontal scroll (matches user reflex on a horizontal strip).
  // Only intercepts when the strip actually overflows; otherwise lets the page scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const overflows = el.scrollWidth - el.clientWidth > 1;
      if (!overflows) return;
      // If the user is using a trackpad with horizontal intent, keep native behavior.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Auto-center the selected chip when it changes — including on initial mount.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const target = root.querySelector<HTMLElement>(
      `[data-ordinal-idx="${currentOrdinalIdx}"]`,
    );
    if (!target) return;
    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentOrdinalIdx, slots.length]);

  // Smooth-scroll the timeline so a given calendar idx is centered. Used by
  // year-ribbon clicks.
  const scrollToCalendarIdx = useCallback((calendarIdx: number) => {
    const root = scrollRef.current;
    if (!root) return;
    const slotArrayIdx = slots.findIndex((s) => s.real.idx === calendarIdx);
    if (slotArrayIdx < 0) return;
    // RTL: chip's logical-start (right) edge is at `slotArrayIdx * SLOT_WIDTH` from
    // the right. Center it in the viewport.
    const targetCenterFromRight = (slotArrayIdx + 0.5) * SLOT_WIDTH;
    const desiredScrollLeft = -(targetCenterFromRight - root.clientWidth / 2);
    root.scrollTo({ left: desiredScrollLeft, behavior: "smooth" });
  }, [slots]);

  const addAnnotation = useCallback((idx: number, label: string) => {
    setState((s) => ({
      ...s,
      annotations: { ...s.annotations, [idx]: label },
    }));
  }, []);

  const removeAnnotation = useCallback((idx: number) => {
    setState((s) => {
      const next = { ...s.annotations };
      delete next[idx];
      return { ...s, annotations: next };
    });
  }, []);

  if (ordinals.length === 0) return null;

  const totalWidth = slots.length * SLOT_WIDTH;
  // Core range in pixels (where the solid metronome line lives)
  const coreStartPx = (coreStart - (slots[0]?.real.idx ?? 0)) * SLOT_WIDTH;
  const coreWidthPx = Math.max(0, (coreEnd - coreStart + 1) * SLOT_WIDTH);
  const leadingPadPx = coreStartPx;
  const trailingPadPx = totalWidth - coreStartPx - coreWidthPx;

  // The "primary next" slot — chronologically first padding slot past coreEnd,
  // skipping summer (since summer is the optional/non-default season).
  const nextIdx = coreEnd + 1;
  const nextRem = ((nextIdx % 3) + 3) % 3;
  const primaryNextIdx = nextRem === 2 ? nextIdx + 1 : nextIdx;

  // Snapped year delta during drag (0 when not dragging)
  const snappedDeltaYears = drag
    ? Math.round(-drag.deltaX / (3 * SLOT_WIDTH))
    : 0;

  // Target array indices of the dragged chip and its followers
  // (where they'll land after the snap)
  const targetArrayIndices: number[] = useMemo(() => {
    if (!drag || snappedDeltaYears === 0) return [];
    const result: number[] = [];
    for (let ord = drag.ordinalIdx; ord < state.positions.length; ord++) {
      const originalIdx = state.positions[ord];
      const targetCalendarIdx = originalIdx + snappedDeltaYears * 3;
      const arrayIdx = slots.findIndex((s) => s.real.idx === targetCalendarIdx);
      if (arrayIdx >= 0) result.push(arrayIdx);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, snappedDeltaYears, slots, state.positions]);

  // Original (committed) array index of the dragged chip — rendered as a ghost
  const draggedOriginalArrayIdx = useMemo(() => {
    if (!drag) return -1;
    return slots.findIndex(
      (s) => s.kind === "ordinal" && s.ordinalIdx === drag.ordinalIdx,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, slots]);

  // The destination real semester of the dragged chip — for the floating badge
  const targetDraggedSemester = useMemo(() => {
    if (!drag || snappedDeltaYears === 0) return null;
    const origIdx = state.positions[drag.ordinalIdx];
    const targetIdx = origIdx + snappedDeltaYears * 3;
    const { year, season } = fromLinearIdx(targetIdx);
    return { year, season, idx: targetIdx };
  }, [drag, snappedDeltaYears, state.positions]);

  // The set of academic years the moved chips will land in (for highlighting labels)
  const targetAcYears = useMemo(() => {
    const s = new Set<number>();
    targetArrayIndices.forEach((idx) => {
      const slot = slots[idx];
      if (slot) s.add(slot.real.year + 1);
    });
    return s;
  }, [targetArrayIndices, slots]);

  // Snap follower chips visually to year increments
  const computeFollowOffset = (slot: Slot): number | undefined => {
    if (!drag || drag.deltaX === 0) return undefined;
    if (slot.kind !== "ordinal") return undefined;
    if (slot.ordinalIdx > drag.ordinalIdx) {
      // Reverse sign for RTL (positive calendar delta = negative screen x)
      return -snappedDeltaYears * 3 * SLOT_WIDTH;
    }
    return undefined;
  };

  return (
    <div className={cn("relative w-full", className)} dir="rtl">
      {/* Fade overlay on the start (right) edge when there's more content that way */}
      <div
        className={cn(
          "absolute top-0 bottom-0 right-0 w-10 pointer-events-none z-20",
          "bg-gradient-to-l from-background to-transparent",
          "transition-opacity duration-150",
          overflow.start ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      {/* Fade overlay on the end (left) edge */}
      <div
        className={cn(
          "absolute top-0 bottom-0 left-0 w-10 pointer-events-none z-20",
          "bg-gradient-to-r from-background to-transparent",
          "transition-opacity duration-150",
          overflow.end ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />

      <div
        ref={scrollRef}
        onPointerDown={onGrabPointerDown}
        onPointerMove={onGrabPointerMove}
        onPointerUp={endGrabScroll}
        onPointerLeave={endGrabScroll}
        onPointerCancel={endGrabScroll}
        className={cn(
          "w-full overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden flex",
          (overflow.start || overflow.end) && "cursor-grab active:cursor-grabbing",
        )}
        style={{ scrollbarWidth: "none", justifyContent: "safe center" }}
      >
        <DndContext
          sensors={sensors}
          modifiers={[restrictToHorizontalAxis]}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          autoScroll={{
            threshold: { x: 0.15, y: 0 },
            acceleration: 12,
            interval: 5,
          }}
        >
          <div
            className="relative select-none shrink-0"
            style={{ width: totalWidth }}
          >
            {/* Chips row */}
            <div className="relative" style={{ height: CHIP_HEIGHT }}>
              {/* Origin ghost — where the dragged chip started (dashed outline) */}
              {drag && snappedDeltaYears !== 0 && draggedOriginalArrayIdx >= 0 && (
                <div
                  className={cn(
                    "absolute top-0 px-1 pointer-events-none",
                    "transition-opacity duration-150",
                  )}
                  style={{
                    right: draggedOriginalArrayIdx * SLOT_WIDTH,
                    width: SLOT_WIDTH,
                    height: CHIP_HEIGHT,
                  }}
                >
                  <div className="h-full w-full rounded-md border-2 border-dashed border-foreground/30 bg-foreground/[0.02]" />
                </div>
              )}

              {/* Target highlight — subtle fills at destination slots */}
              {drag && snappedDeltaYears !== 0 &&
                targetArrayIndices.map((targetIdx, k) => (
                  <div
                    key={`target-${k}`}
                    className="absolute top-0 px-1 pointer-events-none"
                    style={{
                      right: targetIdx * SLOT_WIDTH,
                      width: SLOT_WIDTH,
                      height: CHIP_HEIGHT,
                    }}
                  >
                    <div className="h-full w-full rounded-md bg-foreground/5 ring-1 ring-foreground/20" />
                  </div>
                ))}

              {/* Chips */}
              {slots.map((slot, i) => {
                const followOffsetX = computeFollowOffset(slot);
                const isDraggedChip =
                  drag &&
                  slot.kind === "ordinal" &&
                  slot.ordinalIdx === drag.ordinalIdx;
                return (
                  <div
                    key={slot.id}
                    data-ordinal-idx={
                      slot.kind === "ordinal" ? slot.ordinalIdx : undefined
                    }
                    className="absolute top-0 px-1"
                    style={{
                      right: i * SLOT_WIDTH,
                      width: SLOT_WIDTH,
                      height: CHIP_HEIGHT,
                    }}
                  >
                    {slot.kind === "ordinal" ? (
                      <OrdinalChip
                        slot={slot}
                        isActive={slot.ordinalIdx === currentOrdinalIdx}
                        followOffsetX={followOffsetX}
                        onSelect={() => onSelectOrdinal(slot.ordinalIdx)}
                        onDelete={
                          onDeleteSemester
                            ? () => handleDeleteSemesterAt(slot.ordinalIdx)
                            : undefined
                        }
                      />
                    ) : (
                      <EmptySlotView
                        slot={slot}
                        canAdd={!!onAddSemester}
                        isGhost={
                          // In-core empty slots; OR padding slots up to (and
                          // including) the primary-next slot — so the skipped
                          // summer between the last chip and the promoted next
                          // still reads as a ghost.
                          !slot.isPadding ||
                          (slot.real.idx > coreEnd &&
                            slot.real.idx <= primaryNextIdx)
                        }
                        isPrimaryNext={
                          !!onAddSemester &&
                          slot.isPadding &&
                          slot.real.idx === primaryNextIdx
                        }
                        onAddSemester={
                          onAddSemester
                            ? () => handleAddSemesterAtSlot(slot.real.idx, slot.real.season)
                            : undefined
                        }
                        onAddAnnotation={(label) => addAnnotation(slot.real.idx, label)}
                        onRemoveAnnotation={() => removeAnnotation(slot.real.idx)}
                      />
                    )}
                    {/* Floating year-change badge attached to the dragged chip */}
                    {isDraggedChip && snappedDeltaYears !== 0 && targetDraggedSemester && (
                      <div
                        className={cn(
                          "absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
                          "px-2 py-1 rounded-md bg-foreground text-background",
                          "text-[11px] font-medium shadow-lg z-40",
                          "pointer-events-none",
                        )}
                        style={{
                          top: -34,
                          transform: `translate3d(calc(-50% + ${snappedDeltaYears * 3 * SLOT_WIDTH}px), 0, 0)`,
                        }}
                      >
                        {snappedDeltaYears > 0 ? "+" : ""}
                        {snappedDeltaYears} {Math.abs(snappedDeltaYears) === 1 ? "שנה" : "שנים"}
                        {" · "}
                        {formatSlotTitle(targetDraggedSemester)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Metronome ruler: solid core + dashed 1yr padding each side */}
            <div className="relative mt-2" style={{ height: 8 }}>
              {/* Leading dashed */}
              {leadingPadPx > 0 && (
                <div
                  className="absolute top-0 border-t border-dashed border-border/50"
                  style={{ right: 0, width: leadingPadPx }}
                />
              )}
              {/* Solid core */}
              <div
                className="absolute top-0 h-px bg-border"
                style={{ right: leadingPadPx, width: coreWidthPx }}
              />
              {/* Trailing dashed */}
              {trailingPadPx > 0 && (
                <div
                  className="absolute top-0 border-t border-dashed border-border/50"
                  style={{ right: leadingPadPx + coreWidthPx, width: trailingPadPx }}
                />
              )}
              {/* Ticks */}
              {slots.map((slot, i) => {
                const isYearStart = slot.real.season === "winter";
                const inPadding = slot.isPadding;
                return (
                  <div
                    key={`tick-${i}`}
                    className={cn(
                      "absolute top-0 w-px",
                      inPadding
                        ? "bg-border/40 h-1"
                        : isYearStart
                        ? "bg-border h-2"
                        : "bg-border/70 h-1",
                    )}
                    style={{ right: i * SLOT_WIDTH }}
                  />
                );
              })}
              {/* Closing tick at the far-left end */}
              <div
                className="absolute top-0 w-px h-1 bg-border/40"
                style={{ right: slots.length * SLOT_WIDTH }}
              />
            </div>

            {/* Year labels — each year is a tinted tile spanning its 3 slots, */}
            {/* animated smoothly when the anchor shifts. Clicking a year tile  */}
            {/* scrolls that year into the center of the viewport.              */}
            <div className="relative mt-1.5" style={{ height: 20 }}>
              <AnimatePresence initial={false}>
                {yearGroups.map((g) => {
                  const isTarget = targetAcYears.has(g.ac);
                  const middleSlot = slots[g.startIdx + Math.floor(g.count / 2)];
                  return (
                    <motion.button
                      type="button"
                      key={g.ac}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        right: g.startIdx * SLOT_WIDTH + 1.5,
                        width: g.count * SLOT_WIDTH - 3,
                      }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{
                        duration: 0.35,
                        ease: [0.25, 1, 0.4, 1],
                        opacity: { duration: 0.2 },
                      }}
                      onClick={() =>
                        middleSlot && scrollToCalendarIdx(middleSlot.real.idx)
                      }
                      title={`${g.ac - 1}-${g.ac} · לחצו לדפדוף`}
                      className={cn(
                        "absolute top-0 h-full rounded-sm",
                        "flex items-center justify-center",
                        "text-[11px] tabular-nums cursor-pointer",
                        "hover:bg-foreground/10 hover:text-foreground transition-colors",
                        isTarget
                          ? "bg-foreground/12 text-foreground font-semibold"
                          : g.anyCore
                          ? "bg-muted/50 text-muted-foreground"
                          : "bg-muted/20 text-muted-foreground/60",
                      )}
                    >
                      {g.ac - 1}-{g.ac}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
