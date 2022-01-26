export async function callWithFallback<R>(
  call: Promise<R>,
  fallback: any
): Promise<R> {
  let result: R;
  try {
    result = (await call) || fallback;
  } catch {
    result = fallback;
  }

  return result;
}
