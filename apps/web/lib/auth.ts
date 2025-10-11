import api from './api';

export async function login(email: string, password: string, otp?: string) {
  const { data } = await api.post('/api/auth/login', { email, password, otp });
  if (typeof window !== 'undefined')
    localStorage.setItem('token', data.token || data.accessToken || '');
  return data;
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
    localStorage.setItem('token', data.token || data.accessToken || '');
  return { accessToken: data.accessToken || data.token };
}
