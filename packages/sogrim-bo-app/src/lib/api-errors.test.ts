import { describe, it, expect } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { isAuthorizationError } from "./api-errors";

function axiosError(status: number, data: unknown): AxiosError {
  const response = { status, data, statusText: "", headers: {}, config: {} } as AxiosResponse;
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, response);
}

describe("isAuthorizationError", () => {
  it("is true for a 401 caused by insufficient permissions", () => {
    expect(
      isAuthorizationError(
        axiosError(401, "Permission denied: User not authorized to access this resource"),
      ),
    ).toBe(true);
  });

  it("is false for a 401 caused by an expired/invalid token (should refresh instead)", () => {
    expect(
      isAuthorizationError(axiosError(401, "Permission denied: Invalid JWT: ExpiredSignature")),
    ).toBe(false);
    expect(isAuthorizationError(axiosError(401, "No authorization header"))).toBe(false);
  });

  it("is true for a 403 response", () => {
    expect(isAuthorizationError(axiosError(403, "forbidden"))).toBe(true);
  });

  it("handles an object body with a message field", () => {
    expect(
      isAuthorizationError(axiosError(401, { message: "User not authorized to access this resource" })),
    ).toBe(true);
  });

  it("is false for other statuses and non-axios errors", () => {
    expect(isAuthorizationError(axiosError(500, "boom"))).toBe(false);
    expect(isAuthorizationError(new Error("nope"))).toBe(false);
    expect(isAuthorizationError(null)).toBe(false);
  });
});
