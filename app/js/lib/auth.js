import { supabase } from "./supabase.js";
import { normalizeReg, validReg, normalizeText } from "./security.js";
import { setState } from "./state.js";

export async function session() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  setState({ user: data.session?.user ?? null });
  return data.session;
}
export async function user() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}
export async function profile() {
  const u = await user().catch(() => null);
  if (!u) {
    setState({ profile: null });
    return null;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,full_name,reg_number,whatsapp_number,avatar_url,role,verified,created_at,updated_at",
    )
    .eq("id", u.id)
    .single();
  if (error) throw error;
  setState({ profile: data });
  return data;
}
export async function signUp({
    email,
    password,
    fullName,
    regNumber,
    whatsapp
}) {

    const reg =
        normalizeReg(regNumber);

    if (!validReg(reg)) {
        throw new Error(
            'Enter a valid Domasi College registration number.'
        );
    }

    if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)
    ) {
        throw new Error(
            'Enter a valid email address.'
        );
    }

    if (
        !password ||
        password.length < 8
    ) {
        throw new Error(
            'Password must contain at least 8 characters.'
        );
    }

    const cleanName =
        normalizeText(
            fullName,
            100
        );

    if (
        !cleanName ||
        cleanName.length < 2
    ) {
        throw new Error(
            'Enter your full name.'
        );
    }


    const {
        data,
        error
    } = await supabase.auth.signUp({
        email:
            email
                .trim()
                .toLowerCase(),

        password,

        options: {
            data: {
                full_name:
                    cleanName,

                reg_number:
                    reg,

                whatsapp_number:
                    normalizeText(
                        whatsapp,
                        30
                    ) || null
            }
        }
    });


    if (error) {
        throw error;
    }


    return data;
}
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  setState({ user: data.user });
  await profile().catch(() => null);
  return data;
}
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  setState({ user: null, profile: null });
}
export function onAuth(callback) {
  return supabase.auth.onAuthStateChange((event, s) => {
    setState({ user: s?.user ?? null });
    callback(event, s);
  });
}
