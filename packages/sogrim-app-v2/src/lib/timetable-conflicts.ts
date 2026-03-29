import type { TimetableEvent } from "@/types/timetable";
import { parseTime } from "./timetable-utils";

interface Conflict {
  eventA: TimetableEvent;
  eventB: TimetableEvent;
}

/**
 * Check if two time ranges overlap.
 * [startA, endA) overlaps [startB, endB) when startA < endB && startB < endA
 */
function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const sA = parseTime(startA);
  const eA = parseTime(endA);
  const sB = parseTime(startB);
  const eB = parseTime(endB);
  return sA < eB && sB < eA;
}

/** Find all conflicting pairs among timetable events */
export function findConflicts(events: TimetableEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      if (
        a.day === b.day &&
        a.courseId !== b.courseId &&
        timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)
      ) {
        conflicts.push({ eventA: a, eventB: b });
      }
    }
  }

  return conflicts;
}

/** Returns set of event keys that have conflicts */
export function getConflictingEventKeys(
  events: TimetableEvent[],
): Set<string> {
  const conflicts = findConflicts(events);
  const keys = new Set<string>();

  for (const { eventA, eventB } of conflicts) {
    keys.add(eventKey(eventA));
    keys.add(eventKey(eventB));
  }

  return keys;
}

/** Unique key for a timetable event */
export function eventKey(event: TimetableEvent): string {
  return `${event.courseId}-${event.groupId}-${event.day}-${event.startTime}`;
}
