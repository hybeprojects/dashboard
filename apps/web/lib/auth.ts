import { UserProfile } from '../types/api';

function parseJson(res: Response) {
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(res);
  // server returns Supabase response shape
  const user = data?.user
    ? {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name,
        lastName: data.user.user_metadata?.last_name,
      }
    : null;
  return { accessToken: data?.session?.access_token, user };
}

export async function register(payload: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
}) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  const user = data?.user
    ? {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name,
        lastName: data.user.user_metadata?.last_name,
      }
    : null;
  return { accessToken: data?.session?.access_token, user };
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function me(): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.user || null;
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || '',
      firstName: user.firstName,
      lastName: user.lastName,
    } as UserProfile;
  } catch (e) {
    return null;
  }
}

const auth = { login, register, logout, me };
export default auth;
