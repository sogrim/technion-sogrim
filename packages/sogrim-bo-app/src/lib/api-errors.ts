import { isAxiosError } from "axios";

/**
 * The server message returned when a valid, authenticated user lacks the
 * required permission (see `AppError::Unauthorized` in packages/server).
 */
const NOT_AUTHORIZED_MARKER = "not authorized to access this resource";

/**
 * Distinguish a permission failure from a token failure.
 *
 * Both surface as HTTP 401 from the server, but they need opposite handling:
 * a token problem should trigger a silent Google refresh, while a permission
 * problem should NOT — it means the (correctly authenticated) user simply isn't
 * on the back-office allowlist, so we show an "access restricted" screen instead
 * of bouncing them through a pointless re-login loop.
 */
export function isAuthorizationError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 403) return true;
  if (status !== 401) return false;

  const data = error.response?.data;
  let text = "";
  if (typeof data === "string") {
    text = data;
  } else if (data && typeof data === "object" && "message" in data) {
    text = String((data as { message: unknown }).message);
  }
  return text.toLowerCase().includes(NOT_AUTHORIZED_MARKER);
}
