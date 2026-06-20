import * as api from "@/lib/api";
import { getResourceConfig } from "@/resources/registry";
import { MOCK_LISTS, MOCK_USERS_FULL } from "./fixtures";
import type { ResourceRecord } from "@/types/bo";

/** When true, the UI is served entirely from local fixtures (no backend/login). */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

// --- real (server-backed) ---------------------------------------------------

export async function realList(key: string): Promise<ResourceRecord[]> {
  switch (key) {
    case "catalogs":
      return (await api.listCatalogs()) as unknown as ResourceRecord[];
    case "courses":
      return (await api.listCourses()) as unknown as ResourceRecord[];
    case "users":
      return (await api.listUsers()) as unknown as ResourceRecord[];
    default:
      throw new Error(`Unknown resource: ${key}`);
  }
}

export async function realGet(key: string, id: string): Promise<ResourceRecord> {
  switch (key) {
    case "catalogs":
      return (await api.getCatalog(id)) as unknown as ResourceRecord;
    case "courses":
      return (await api.getCourse(id)) as unknown as ResourceRecord;
    case "users":
      return (await api.getUser(id)) as unknown as ResourceRecord;
    default:
      throw new Error(`Unknown resource: ${key}`);
  }
}

// --- mock (fixtures) --------------------------------------------------------

export async function mockList(key: string): Promise<ResourceRecord[]> {
  const list = MOCK_LISTS[key];
  if (!list) throw new Error(`Unknown resource: ${key}`);
  return list;
}

export async function mockGet(key: string, id: string): Promise<ResourceRecord> {
  const cfg = getResourceConfig(key);
  if (!cfg) throw new Error(`Unknown resource: ${key}`);
  if (key === "users" && MOCK_USERS_FULL[id]) return MOCK_USERS_FULL[id];
  const found = (MOCK_LISTS[key] ?? []).find((row) => cfg.getId(row) === id);
  if (!found) throw new Error(`${cfg.singular} not found: ${id}`);
  return found;
}

// --- public surface ---------------------------------------------------------

export async function listResource(key: string): Promise<ResourceRecord[]> {
  return USE_MOCKS ? mockList(key) : realList(key);
}

export async function getResource(key: string, id: string): Promise<ResourceRecord> {
  return USE_MOCKS ? mockGet(key, id) : realGet(key, id);
}
