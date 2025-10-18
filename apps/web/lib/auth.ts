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
  // Create account
  await api.post('/auth/register', payload);
  // Immediately login to obtain access token
  const { data } = await api.post('/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  return { accessToken: data.accessToken || data.token, user: data.user };
}

export async function logout() {
  await api.post('/auth/logout');
}

export default { login, register, logout };
