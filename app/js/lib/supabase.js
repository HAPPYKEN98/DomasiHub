import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { CONFIG } from "./config.js";
export const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
