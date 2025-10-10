import api from './api';

export async function login(email: string, password: string, otp?: string) {
  const { data } = await api.post('/api/auth/login', { email, password, otp });
  if (typeof window !== 'undefined') localStorage.setItem('token', data.token || data.accessToken || '');
  return data;
}

export async function register(payload: { email: string; password: string; firstName: string; lastName: string }) {
  const { data } = await api.post('/api/auth/signup', payload);
  return data;
}
