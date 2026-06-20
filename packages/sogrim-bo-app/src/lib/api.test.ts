import { describe, it, expect, vi, beforeEach } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("./api-client", () => ({ apiClient: { get } }));

import { listCatalogs, getCatalog, listCourses, getCourse, listUsers, getUser } from "./api";

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: [] });
});

describe("back-office api endpoints", () => {
  it("lists catalogs from /admins/catalogs", async () => {
    get.mockResolvedValue({ data: [{ name: "c" }] });
    const res = await listCatalogs();
    expect(get).toHaveBeenCalledWith("/admins/catalogs");
    expect(res).toEqual([{ name: "c" }]);
  });

  it("gets one catalog by id", async () => {
    get.mockResolvedValue({ data: { name: "c" } });
    await getCatalog("6192e5f4d6c89bbe5647f8db");
    expect(get).toHaveBeenCalledWith("/admins/catalogs/6192e5f4d6c89bbe5647f8db");
  });

  it("lists courses from /admins/courses", async () => {
    await listCourses();
    expect(get).toHaveBeenCalledWith("/admins/courses");
  });

  it("gets one course by id (url-encoded)", async () => {
    await getCourse("02340125");
    expect(get).toHaveBeenCalledWith("/admins/courses/02340125");
  });

  it("lists users from /admins/users", async () => {
    await listUsers();
    expect(get).toHaveBeenCalledWith("/admins/users");
  });

  it("gets one user by id", async () => {
    await getUser("11112222333344445555");
    expect(get).toHaveBeenCalledWith("/admins/users/11112222333344445555");
  });
});
