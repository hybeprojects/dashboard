import api from './api';

export async function login(email: string, password: string, otp?: string) {
  const { data } = await api.post('/auth/login', { email, password, otp });
  localStorage.setItem('token', data.accessToken);
  return data;
}

export async function register(payload: { email: string; password: string; firstName: string; lastName: string }) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}
