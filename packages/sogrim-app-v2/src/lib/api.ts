import { apiClient } from "./api-client";
import type { Catalog, Course, DegreeStatus, UserDetails, UserSettings, UserState } from "@/types/api";

export async function getCatalogs(faculty?: string): Promise<Catalog[]> {
  const params = faculty ? { faculty } : undefined;
  const { data } = await apiClient.get<Catalog[]>("/students/catalogs", { params });
  return data;
}

export async function getCourseByFilter(filterName: string, filter: string): Promise<Course[]> {
  if (!filter) return [];
  try {
    new RegExp(filter);
  } catch {
    return [];
  }
  const { data } = await apiClient.get<Course[]>(`/students/courses?${filterName}=${filter}`);
  return data;
}

export async function getUserState(): Promise<UserState> {
  const { data } = await apiClient.get<UserState>("/students/login");
  return data;
}

export async function putUserCatalog(catalogId: string): Promise<UserState> {
  const { data } = await apiClient.put<UserState>("/students/catalog", catalogId);
  return data;
}

export async function postUserUgData(ugData: string): Promise<UserState> {
  const { data } = await apiClient.post<UserState>("/students/courses", ugData);
  return data;
}

export async function putUserState(details: UserDetails): Promise<Record<string, never>> {
  const { data } = await apiClient.put("/students/details", details);
  return data;
}

export async function getComputeEndGame(): Promise<UserState> {
  const { data } = await apiClient.get<UserState>("/students/degree-status");
  return data;
}

export async function putUserSettings(settings: UserSettings): Promise<UserSettings> {
  const { data } = await apiClient.put<UserSettings>("/students/settings", settings);
  return data;
}

export async function postParseAndCompute(payload: { catalogId: { $oid: string }; gradeSheetAsString: string }): Promise<DegreeStatus> {
  const { data } = await apiClient.post<DegreeStatus>("/admins/parse-compute", payload);
  return data;
}

// Timetable
export interface TimetableStateDTO {
  current_semester: string | null;
  active_draft_id: string | null;
  drafts: TimetableDraftDTO[];
}

export interface TimetableDraftDTO {
  id: string;
  name: string;
  semester: string;
  courses: { course_id: string; selected_groups: Record<string, string> }[];
  custom_events: {
    id: string;
    title: string;
    day: number;
    start_time: string;
    end_time: string;
    color: string | null;
  }[];
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

export async function getTimetable(): Promise<TimetableStateDTO> {
  const { data } = await apiClient.get<TimetableStateDTO>("/students/timetable");
  return data;
}

export async function putTimetable(state: TimetableStateDTO): Promise<void> {
  await apiClient.put("/students/timetable", state);
}
