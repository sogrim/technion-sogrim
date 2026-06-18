import { apiClient } from "./api-client";
import type { Catalog, Course, User, UserSummary } from "@/types/bo";

/**
 * Typed wrappers over the server's read-only back-office endpoints. Every call
 * is gated server-side by `Permissions::Admin` (see packages/server/src/api/bo.rs).
 */

export async function listCatalogs(): Promise<Catalog[]> {
  const { data } = await apiClient.get<Catalog[]>("/admins/catalogs");
  return data;
}

export async function getCatalog(id: string): Promise<Catalog> {
  const { data } = await apiClient.get<Catalog>(`/admins/catalogs/${encodeURIComponent(id)}`);
  return data;
}

export async function listCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>("/admins/courses");
  return data;
}

export async function getCourse(id: string): Promise<Course> {
  const { data } = await apiClient.get<Course>(`/admins/courses/${encodeURIComponent(id)}`);
  return data;
}

export async function listUsers(): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>("/admins/users");
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<User>(`/admins/users/${encodeURIComponent(id)}`);
  return data;
}
