import { supabase } from '../lib/supabase.js';
import {
    normalizeRegistrationNumber,
    isValidRegistrationNumber
} from '../lib/security.js';
import { setState } from '../lib/app-state.js';


export async function getCurrentSession() {
    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error('[Auth] Session error:', error);
        return null;
    }

    return data.session;
}


export async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        return null;
    }

    return user;
}


export async function signUpStudent({
    email,
    password,
    fullName,
    registrationNumber,
    whatsappNumber = null
}) {
    const normalizedReg =
        normalizeRegistrationNumber(registrationNumber);

    if (!isValidRegistrationNumber(normalizedReg)) {
        throw new Error(
            'Please enter a valid Domasi College registration number.'
        );
    }

    if (!fullName?.trim()) {
        throw new Error('Please enter your full name.');
    }

    if (!email?.trim()) {
        throw new Error('Please enter your email address.');
    }

    if (!password || password.length < 8) {
        throw new Error(
            'Your password must contain at least 8 characters.'
        );
    }

    const {
        data,
        error
    } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,

        options: {
            data: {
                full_name: fullName.trim(),
                reg_number: normalizedReg,
                whatsapp_number: whatsappNumber?.trim() || null
            }
        }
    });

    if (error) {
        throw error;
    }

    if (!data.user) {
        throw new Error('Account creation failed.');
    }

    return data;
}


export async function signIn(email, password) {
    const {
        data,
        error
    } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
    });

    if (error) {
        throw error;
    }

    setState({
        user: data.user
    });

    return data;
}


export async function signOut() {
    const {
        error
    } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }

    setState({
        user: null,
        profile: null
    });
}


export function subscribeToAuthChanges(callback) {
    return supabase.auth.onAuthStateChange(
        (event, session) => {

            setState({
                user: session?.user ?? null
            });

            callback(event, session);
        }
    );
}