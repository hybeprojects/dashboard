import type { NextApiRequest, NextApiResponse } from 'next';
import { validateServerEnv, safeTestSupabaseConnection, runDiagnostics } from '../../../lib/supabase/server-utils';
import { logger } from '../../../lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info('supabase-test endpoint called', {
    method: req.method,
    url: req.url,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  });
  try {
    const env = validateServerEnv();
    if (!env.ok) {
      logger.error('Missing Supabase environment variables', { missing: env.missing });
      return res
        .status(500)
        .json({ ok: false, error: 'Missing server environment variables', missing: env.missing });
    }

    const result = await safeTestSupabaseConnection();
    if (!result.ok) {
      logger.warn('Supabase test query failed', { error: result.error });
      return res.status(200).json({
        ok: true,
        message: 'Supabase service client configured',
        test_query: null,
        error: result.error,
      });
    }

    logger.info('Supabase test successful', {
      rows: Array.isArray(result.data) ? result.data.length : 0,
    });
    return res
      .status(200)
      .json({ ok: true, message: 'Supabase service client configured', test_query: result.data });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || err });
  }
}
