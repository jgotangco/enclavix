/** Synthetic demos must never initialize a backend client. */
export function createClient(): never {
  throw new Error("Supabase integration is disabled in S00");
}
