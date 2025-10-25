import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyPassword, createSessionToken } from '../../../lib/db';
import cookie from 'cookie';
import * as yup from 'yup';
import { compose, withCsrfVerify, withRateLimit, withValidation } from '../../../lib/api-middleware';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password } = req.body as { email: string; password: string };

  try {
    const user = await verifyPassword(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const token = createSessionToken(user.id);

    const cookieOpts: any = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    };
    const cookieStr = cookie.serialize('sb-access-token', String(token), cookieOpts);
    res.setHeader('Set-Cookie', cookieStr);

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { first_name: user.firstName, last_name: user.lastName },
      },
      session: { access_token: token },
    });
  } catch (e: any) {
    console.error('login error', e?.message || e);
    return res.status(500).json({ error: e?.message || 'Internal error' });
  }
};

export default compose(
  handler,
  withValidation(schema, 'body'),
  withCsrfVerify(),
  withRateLimit({ windowMs: 60_000, limit: 20 }),
);
