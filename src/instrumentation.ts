export async function register() {
  const { assertApplicationEnvironment } = await import("./lib/env.server");
  assertApplicationEnvironment();
}
