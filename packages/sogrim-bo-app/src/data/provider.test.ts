import { describe, it, expect, vi, beforeEach } from "vitest";

const api = vi.hoisted(() => ({
  listCatalogs: vi.fn(),
  getCatalog: vi.fn(),
  listCourses: vi.fn(),
  getCourse: vi.fn(),
  listUsers: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("@/lib/api", () => api);

import { realList, realGet, mockList, mockGet } from "./provider";

beforeEach(() => {
  Object.values(api).forEach((fn) => {
    fn.mockReset();
    fn.mockResolvedValue([]);
  });
});

describe("realList", () => {
  it("dispatches to the matching api list call", async () => {
    await realList("catalogs");
    expect(api.listCatalogs).toHaveBeenCalled();
    await realList("courses");
    expect(api.listCourses).toHaveBeenCalled();
    await realList("users");
    expect(api.listUsers).toHaveBeenCalled();
  });

  it("throws on an unknown resource", async () => {
    await expect(realList("widgets")).rejects.toThrow(/unknown resource/i);
  });
});

describe("realGet", () => {
  it("dispatches to the matching api get call with the id", async () => {
    await realGet("courses", "02340125");
    expect(api.getCourse).toHaveBeenCalledWith("02340125");
  });

  it("throws on an unknown resource", async () => {
    await expect(realGet("widgets", "x")).rejects.toThrow(/unknown resource/i);
  });
});

describe("mockList", () => {
  it("returns fixtures for a known resource", async () => {
    const catalogs = await mockList("catalogs");
    expect(catalogs.length).toBeGreaterThan(0);
    expect(catalogs[0]).toHaveProperty("name");
  });

  it("throws on an unknown resource", async () => {
    await expect(mockList("widgets")).rejects.toThrow(/unknown resource/i);
  });
});

describe("mockGet", () => {
  it("finds a catalog by its object id", async () => {
    const cat = await mockGet("catalogs", "6192e5f4d6c89bbe5647f8db");
    expect(cat.name).toBe("מדמח תלת שנתי 2024-2025");
  });

  it("returns the full user document for a known sub", async () => {
    const user = await mockGet("users", "11112222333344445555");
    expect(user).toHaveProperty("details");
  });

  it("throws when no record matches the id", async () => {
    await expect(mockGet("courses", "does-not-exist")).rejects.toThrow(/not found/i);
  });
});
