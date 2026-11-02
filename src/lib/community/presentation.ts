/** Display an effective date in its explicitly named community/association zone. */
export function formatWorkspaceDate(value: string, timeZone = "UTC"): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false,timeZoneName:"short",timeZone}).format(new Date(value));
    } catch { return "Date unavailable"; }
}
