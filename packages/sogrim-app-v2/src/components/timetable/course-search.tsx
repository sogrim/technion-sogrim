import { CourseSearch as CourseSearchBase } from "@/components/common/course-search";
import { useTimetableStore } from "@/stores/timetable-store";
import type { CourseSchedule } from "@/types/timetable";

export function CourseSearch() {
  const searchOpen = useTimetableStore((s) => s.searchOpen);
  const setSearchOpen = useTimetableStore((s) => s.setSearchOpen);
  const addCourse = useTimetableStore((s) => s.addCourse);
  const removeCourse = useTimetableStore((s) => s.removeCourse);
  const drafts = useTimetableStore((s) => s.drafts);
  const activeDraftId = useTimetableStore((s) => s.activeDraftId);

  const draft = drafts.find((d) => d.id === activeDraftId);
  const selectedIds = new Set(draft?.courses.map((c) => c.courseId) ?? []);

  const handleSelect = (course: CourseSchedule) => {
    if (selectedIds.has(course.id)) {
      removeCourse(course.id);
    } else {
      addCourse(course.id);
    }
  };

  return (
    <CourseSearchBase
      open={searchOpen}
      onClose={() => setSearchOpen(false)}
      onSelect={handleSelect}
      selectedIds={selectedIds}
      toggleMode={true}
    />
  );
}
