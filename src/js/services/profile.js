import { supabase } from '../lib/supabase.js';
import { setState } from '../lib/app-state.js';


export async function getMyProfile() {
    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        setState({
            profile: null
        });

        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            reg_number,
            whatsapp_number,
            avatar_url,
            role,
            verified,
            created_at,
            updated_at
        `)
        .eq('id', user.id)
        .single();

    if (error) {
        console.error(
            '[Profile] Failed to load profile:',
            error
        );

        setState({
            profile: null
        });

        return null;
    }

    setState({
        profile: data
    });

    return data;
}