import type { NextApiRequest } from 'next';
import cookie from 'cookie';
import { verifySessionToken, getUserById } from '../lib/db';

export async function getUserFromRequest(req: any) {
  const cookieHeader = (req.headers.cookie as string) || '';
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'] || null;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload || !payload.sub) return null;
  const user = await getUserById(payload.sub as string);
  return user;
}
