import getSupabaseClient from './supabase/client';
import api from './api';
import { UserProfile } from '../types/api';

export async function login(email: string, password: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const session = data?.session;
  const accessToken = session?.access_token;
  if (!accessToken) throw new Error('No access token returned');

  // Ensure app profile exists on backend
  await api.post(
    '/auth/setup-profile',
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return { accessToken, user: session?.user as unknown as UserProfile };
}

export async function register(payload: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: { first_name: payload.firstName || null, last_name: payload.lastName || null },
    },
  });
  if (error) throw error;

  // After signUp, if user is confirmed and session exists, call setup-profile; otherwise client should call setup-profile after they verify / sign in
  const session = (data as any)?.session;
  const accessToken = session?.access_token;
  if (accessToken) {
    await api.post(
      '/auth/setup-profile',
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  }

  return data;
}

export async function logout() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export default { login, register, logout };
