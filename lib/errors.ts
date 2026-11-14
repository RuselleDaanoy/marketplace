/** Turns any thrown value (Error, Supabase error object, string) into a message. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const maybe = (err as { message?: unknown }).message;
    if (typeof maybe === "string" && maybe) return maybe;
    const details = (err as { details?: unknown }).details;
    if (typeof details === "string" && details) return details;
  }
  return String(err);
}
