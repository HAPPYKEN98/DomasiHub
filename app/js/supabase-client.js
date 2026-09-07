(function () {
  const SUPABASE_URL =
    window.DOMASI_SUPABASE_URL || "https://lprtpbrchyltnuscgkuv.supabase.co";
  const SUPABASE_ANON_KEY =
    window.DOMASI_SUPABASE_ANON_KEY ||
    "sb_publishable_zgm6MaVWIjpU1eeM3UtQaQ_lGgTTS1H";
  if (!window.supabase) {
    console.error("Supabase SDK failed to load.");
    return;
  }
  window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
})();

