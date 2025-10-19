import { createClient as createBrowserClient } from './supabase/client';
import { UserProfile } from '../types/api';
import getSupabase from './supabase';

const supabase = getSupabase();

function extractUser(dataUser: any): UserProfile | null {
  if (!dataUser) return null;
  return {
    id: dataUser.id,
    email: dataUser.email,
    firstName: dataUser.user_metadata?.first_name,
    lastName: dataUser.user_metadata?.last_name,
  };
}

export async function login(email: string, password: string) {
  if (!supabase) throw new Error('Supabase client not available');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || 'Sign in failed');
  const user = extractUser(data?.user);
  return {
    accessToken: data?.session?.access_token,
    user,
  };
}

export async function register(payload: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
}) {
  const { email, password, firstName, lastName } = payload;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName, user_type: payload.userType } },
  });
  if (error) throw error;
  const user = data?.user || null;
  return {
    accessToken: data?.session?.access_token,
    user: user
      ? {
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.first_name,
          lastName: user.user_metadata?.last_name,
        }
      : null,
  };
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function me(): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user || null;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
    };
  } catch (e) {
    return null;
  }
}

export default { login, register, logout, me };
