import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jrtkntpigyutkcubouht.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_pyqEe3HVdUXg4jS-IUsddQ_izSkzM9a';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);