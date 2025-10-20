import type { NextApiRequest } from 'next';
import getServerSupabase from '../pages/api/_serverSupabase';

export async function getUserFromRequest(req: NextApiRequest) {
  const cookieHeader = (req.headers.cookie as string) || '';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cookie = require('cookie');
  const cookies = cookieHeader ? cookie.parse(cookieHeader) : {};
  const token =
    cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'] || null;

  if (!token) return null;
  const supabase = getServerSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token as string);
    if (error || !data?.user) return null;
    return data.user;
  } catch (e) {
    return null;
  }
}
