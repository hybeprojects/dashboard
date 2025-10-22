import { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint is a best-effort callback handler for OAuth/magic-link redirects.
  // It will set a server-side cookie when Supabase returns tokens in query params.
  try {
    const { access_token, refresh_token, expires_in, error, error_description } = req.query as any;

    if (error) {
      // Redirect to login with error message
      const dest = '/login';
      return res.redirect(dest);
    }

    if (access_token) {
      const token = String(access_token);
      const maxAge = expires_in ? Number(expires_in) : undefined;
      const cookieOpts: any = {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      };
      if (typeof maxAge === 'number' && !Number.isNaN(maxAge)) cookieOpts.maxAge = maxAge;

      res.setHeader('Set-Cookie', cookie.serialize('sb-access-token', token, cookieOpts));

      // Optionally set refresh token
      if (refresh_token) {
        res.setHeader(
          'Set-Cookie',
          cookie.serialize('sb-refresh-token', String(refresh_token), { ...cookieOpts }),
        );
      }

      // Redirect to dashboard or provided next param
      const redirectTo = (req.query.next as string) || '/dashboard';
      return res.redirect(redirectTo);
    }

    // Nothing to do — redirect to login
    return res.redirect('/login');
  } catch (err) {
    console.error('Auth callback error', err);
    return res.redirect('/login');
  }
}
