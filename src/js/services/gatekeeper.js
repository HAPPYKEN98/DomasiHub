import { supabase } from '../lib/supabase.js';
import { normalizeRegistrationNumber } from '../lib/security.js';

export async function checkRegistrationNumber(registrationNumber) {
    const normalized = normalizeRegistrationNumber(registrationNumber);

    /*
     * This function is intentionally small.
     *
     * The actual uniqueness/security decision will eventually
     * be enforced by PostgreSQL/RLS, not by JavaScript.
     */

    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('reg_number', normalized)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return {
        available: !data,
        registrationNumber: normalized
    };
}