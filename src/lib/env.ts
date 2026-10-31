/** Client-visible mode only controls presentation; server policy lives in env.server.ts. */
export function isDemoModeEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === "demo";
}
