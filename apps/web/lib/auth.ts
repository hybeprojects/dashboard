import api from './api';
import { AuthResponse, UserProfile } from '../types/api';

export async function login(email: string, password: string, otp?: string): Promise<{ accessToken: string; user: UserProfile }> {
  const { data } = await api.post('/api/auth/login', { email, password, otp });
  if (typeof window !== 'undefined')
    localStorage.setItem('token', data.accessToken || data.token || '');
  return data as { accessToken: string; user: UserProfile };
}

export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  // Create account
  await api.post('/api/auth/register', payload);
  // Immediately login to obtain access token
  const { data } = await api.post('/api/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  if (typeof window !== 'undefined')
    localStorage.setItem('token', data.accessToken || data.token || '');
  return { accessToken: data.accessToken || data.token, user: data.user };
}

export async function logout() {
  await api.post('/api/auth/logout');
  if (typeof window !== 'undefined') localStorage.removeItem('token');
}

export default { login, register, logout };
