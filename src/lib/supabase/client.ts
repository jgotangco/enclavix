/** Web account flows use HttpOnly server sessions and the shared API. */
export function createClient(): never {
  throw new Error("Direct browser backend access is disabled; use account services");
}
