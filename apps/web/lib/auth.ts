import api from './api';
import { AuthResponse, UserProfile } from '../types/api';

export async function login(
  email: string,
  password: string,
  otp?: string,
): Promise<{ accessToken: string; user: UserProfile }> {
  const { data } = await api.post('/auth/login', { email, password, otp });
  return data as { accessToken: string; user: UserProfile };
}

export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  await api.post('/auth/register', payload);
  const { data } = await api.post('/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  return { accessToken: data.accessToken || data.token, user: data.user };
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function me(): Promise<UserProfile | null> {
  try {
    const { data } = await api.get('/auth/me');
    return (data && data.user) || null;
  } catch {
    return null;
  }
}

export default { login, register, logout, me };
