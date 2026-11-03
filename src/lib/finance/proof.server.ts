import { createHash } from "node:crypto";
import { RequestError } from "../auth/request";

export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export function proofBytes(encoded: unknown, type: unknown): Buffer {
  if (typeof encoded !== "string" || encoded.length > Math.ceil(MAX_PROOF_BYTES / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw new RequestError("Invalid proof");
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > MAX_PROOF_BYTES) throw new RequestError("Proof too large", 413);
  const valid = type === "application/pdf" ? bytes.subarray(0, 5).toString() === "%PDF-"
    : type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : false;
  if (!valid) throw new RequestError("Proof type mismatch");
  return bytes;
}
export function proofHash(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
export function assertCurrentProof(expected: { object_path?: string; sha256: string; size_bytes: string }, current: { status?: string; object_path?: string; sha256?: string; size_bytes?: string }): void {
  if (current.status !== "clean" || !current.object_path || current.object_path !== expected.object_path || current.sha256 !== expected.sha256 || current.size_bytes !== expected.size_bytes) throw new RequestError("Proof access withdrawn", 403);
}

/** Operator-configured internal scanner, no user URL or redirect. No scanner means no upload success. */
export async function scanProof(bytes: Buffer, type: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const target = process.env.ENCLAVIX_SCANNER_URL;
  const token = process.env.ENCLAVIX_SCANNER_TOKEN;
  if (!target || !token) throw new RequestError("Scanner unavailable", 503);
  const url = new URL(target);
  const localTest = process.env.ENCLAVIX_LOCAL_AUTH_TEST === "1" && url.protocol === "http:" && url.hostname === "127.0.0.1";
  if ((!localTest && url.protocol !== "https:") || url.username || url.password || url.hash || url.search) throw new RequestError("Invalid scanner configuration", 503);
  const response = await fetcher(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": type, "X-Content-SHA256": proofHash(bytes) }, body: new Uint8Array(bytes), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new RequestError("Scanner unavailable", 503);
  // Bound the scanner's response too; a proxy error must not allocate an unbounded body.
  const reader = response.body?.getReader();
  if (!reader) throw new RequestError("Invalid scanner response", 503);
  const chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const r = await reader.read(); if (r.done) break; size += r.value.length; if (size > 4096) { await reader.cancel(); throw new RequestError("Scanner response too large", 503); } chunks.push(r.value); } } finally { reader.releaseLock(); }
  const verdict = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { sha256?: string; verdict?: string };
  if (verdict.sha256 !== proofHash(bytes) || !["clean", "infected"].includes(verdict.verdict || "")) throw new RequestError("Invalid scanner verdict", 503);
  return verdict.verdict === "clean";
}
