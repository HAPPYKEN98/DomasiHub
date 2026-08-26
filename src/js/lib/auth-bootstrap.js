import {
    getCurrentSession,
    subscribeToAuthChanges
} from '../services/auth.js';

import { getMyProfile } from '../services/profile.js';
import { setState } from './app-state.js';

export async function initializeAuth() {
    const session = await getCurrentSession();

    setState({
        user: session?.user ?? null
    });

    if (session?.user) {
        await getMyProfile();
    }

    subscribeToAuthChanges(async (_event, newSession) => {
        setState({
            user: newSession?.user ?? null
        });

        if (newSession?.user) {
            await getMyProfile();
        } else {
            setState({
                profile: null
            });
        }
    });

    return session;
}
