import type { NextApiRequest, NextApiResponse } from 'next';
import { validateServerEnv, safeTestSupabaseConnection } from '../../../lib/supabase/server-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const env = validateServerEnv();
    if (!env.ok) {
      return res
        .status(500)
        .json({ ok: false, error: 'Missing server environment variables', missing: env.missing });
    }

    const result = await safeTestSupabaseConnection();
    if (!result.ok) {
      return res
        .status(200)
        .json({
          ok: true,
          message: 'Supabase service client configured',
          test_query: null,
          error: result.error,
        });
    }

    return res
      .status(200)
      .json({ ok: true, message: 'Supabase service client configured', test_query: result.data });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || err });
  }
}
