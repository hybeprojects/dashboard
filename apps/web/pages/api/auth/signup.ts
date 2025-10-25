import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser, createSessionToken } from '../../../lib/db';
import cookie from 'cookie';
import * as yup from 'yup';
import {
  compose,
  withCsrfVerify,
  withRateLimit,
  withValidation,
} from '../../../lib/api-middleware';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
  firstName: yup.string().max(100).nullable().optional(),
  lastName: yup.string().max(100).nullable().optional(),
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password, firstName, lastName } = req.body as {
    email: string;
    password: string;
    firstName?: string | null;
    lastName?: string | null;
  };

  try {
    const user = await createUser({
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
    const token = createSessionToken(user.id);

    const cookieStr = cookie.serialize('sb-access-token', String(token), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    });
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
    console.error('signup error', e?.message || e);
    return res.status(400).json({ error: e?.message || 'Could not create user' });
  }
};

export default compose(
  handler,
  withValidation(schema, 'body'),
  withCsrfVerify(),
  withRateLimit({ windowMs: 60_000, limit: 10 }),
);
