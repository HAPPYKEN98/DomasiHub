import { session, profile, onAuth } from "./auth.js";
export async function boot() {
  const s = await session().catch(() => null);
  if (s?.user) await profile().catch(() => null);
  onAuth(async (_e, s2) => {
    if (s2?.user) await profile().catch(() => null);
  });
  document.documentElement.dataset.ready = "true";
  return s;
}
