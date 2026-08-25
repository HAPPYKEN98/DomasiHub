import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = '';
const SUPABASE_PUBLISHABLE_KEY = '';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
        '[Domasi Hub] Supabase credentials are not configured yet.'
    );
}

export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_PUBLISHABLE_KEY || 'placeholder-key'
);