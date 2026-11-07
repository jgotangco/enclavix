/** Private, per-account in-memory retry state. Never persist payloads or credentials to disk. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]),
  );
  return value;
}
export function createAccountApi(fetcher: typeof fetch = fetch, newKey = () => crypto.randomUUID()) {
  const pending = new Map<string, string>();
  function clearPending(path?: string, matching?: Record<string, unknown>) {
    if (!path) pending.clear();
    else for (const key of pending.keys()) {
      if (!key.startsWith(`${path}:`)) continue;
      const body = JSON.parse(key.slice(path.length + 1)) as Record<string, unknown>;
      const matches = !matching || Object.entries(matching).every(([field, value]) =>
        field === "p_email" && typeof body[field] === "string" && typeof value === "string"
          ? (body[field] as string).trim().toLowerCase() === value.trim().toLowerCase()
          : body[field] === value);
      if (matches) pending.delete(key);
    }
  }
  async function api(path: string, body?: unknown) {
    const mutation = body !== undefined;
    const tracked = mutation && (path.startsWith("access/") || path.startsWith("community/") || path.startsWith("finance/") || path === "announcements" || path === "tickets" || path === "documents" || path === "privacy");
    const fingerprint = `${path}:${JSON.stringify(canonical(body))}`;
    const key = tracked ? pending.get(fingerprint) ?? newKey() : mutation ? newKey() : undefined;
    if (tracked) pending.set(fingerprint, key!);
    // A failed fetch or unreadable response has an uncertain outcome. Preserve its key.
    const response = await fetcher(`/api/v1/${path}`, mutation ? {
      method: "POST", headers: {"Content-Type":"application/json", "Idempotency-Key": key!},
      body: JSON.stringify(body), cache: "no-store",
    } : {cache:"no-store"});
    const payload = await response.json();
    if (response.ok) {
      if (!payload || typeof payload !== "object" || !Object.hasOwn(payload, "data")) throw new Error("The service response could not be confirmed. Retry the same request.");
      if (tracked) pending.delete(fingerprint);
      return payload.data;
    }
    // Preserve conflict keys too: an invitation may already exist after a lost response.
    // A deliberate replacement is allowed only after explicit revocation in the UI.
    if (tracked && response.status < 500 && response.status !== 409) pending.delete(fingerprint);
    const message = response.status === 401 ? "Sign in with a verified email address to continue."
      : response.status === 409 && path.startsWith("finance/") ? "This finance request conflicts with an earlier record. Refresh and review its durable status before retrying."
      : response.status === 409 && path === "tickets" ? "This ticket request conflicts with an earlier attempt. Refresh the queue before retrying."
      : response.status === 409 && path === "announcements" ? "This announcement conflicts with an earlier request. Refresh the feed before trying again."
      : response.status === 409 ? "This request conflicts with an earlier attempt. Refresh the access workspace. If an invitation was already created but its token was lost, revoke it before issuing a replacement."
      : response.status === 429 ? "Too many requests. Wait before trying again."
      : response.status >= 500 ? "The service is unavailable. Try again; an uncertain request will keep its original request key."
      : "Request not permitted. Staff actions require a recent MFA sign-in. Check your details and try again.";
    throw new Error(message);
  }
  return {api, clearPending};
}
