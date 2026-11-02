export class RequestError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}
export function requestOrigin(request: Request): string {
  const target = new URL(request.url);
  const host = request.headers.get("host");
  if (host) target.host = host;
  return target.origin;
}
/** Cookie mutations require a same-origin JSON request; native clients use verified bearer tokens. */
export function bearerFrom(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  if (!/^Bearer [A-Za-z0-9._~-]+$/.test(header)) throw new RequestError("Invalid authorization",401);
  return header.slice(7);
}
export function checkMutation(request: Request, bearer?: string): void {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new RequestError("JSON required",415);
  // Host retains the browser's authority when Next normalizes loopback addresses.
  // Never use a caller-supplied X-Forwarded-Host.
  if (!bearer && request.headers.get("origin") !== requestOrigin(request)) throw new RequestError("Same-origin request required",403);
}
export function fields(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) throw new RequestError("Invalid request fields");
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 1000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new RequestError("Invalid text");
  return value;
}
export function uuid(value: unknown): string {
  const s = text(value, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) throw new RequestError("Invalid identifier");
  return s;
}

export async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("JSON required",415);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new RequestError("Request too large",413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
