import { RequestError } from "./request";

/** Hide account-existence signals, but never turn provider outages or throttling into success. */
export function checkEmailResult(error: {status?: number; code?: string} | null): void {
  if (!error) return;
  if (error.status === 429) throw new RequestError("Email request rate limited", 429);
  if (!error.status || error.status >= 500 || error.status === 401 || error.status === 403) {
    throw new RequestError("Email service unavailable", 503);
  }
  if (["user_already_exists", "email_exists", "user_not_found"].includes(error.code ?? "")) return;
  throw new RequestError("Email request could not be processed", 400);
}
