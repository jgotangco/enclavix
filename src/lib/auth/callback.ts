type Exchange = { exchangeCodeForSession(code: string, options?: {flowId?: string}): Promise<{error: unknown}> };
/** Never fall back to another flow when an explicit identifier is malformed or missing in storage. */
export async function exchangeCallback(auth: Exchange, url: URL): Promise<boolean> {
  const codes = url.searchParams.getAll("code");
  const flows = url.searchParams.getAll("sb_flow_id");
  if (codes.length !== 1 || !codes[0] || codes[0].length >= 2048 || flows.length > 1) return false;
  if (flows.length && !/^[A-Za-z0-9_-]{8,64}$/.test(flows[0])) return false;
  const {error} = await auth.exchangeCodeForSession(codes[0], flows.length ? {flowId: flows[0]} : undefined);
  return !error;
}
