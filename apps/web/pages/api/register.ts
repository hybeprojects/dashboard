import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser } from '../../lib/db';
import * as yup from 'yup';
import {
  compose,
  withCsrfVerify,
  withRateLimit,
  withValidation,
} from '../../lib/api-middleware';

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

  const { email, password, firstName, lastName } = req.body;

  try {
    const user = await createUser({
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
    return res.status(201).json({ user });
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
