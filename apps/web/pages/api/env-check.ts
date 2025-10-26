import type { NextApiRequest, NextApiResponse } from 'next';

type EnvCheckResult = {
  public: {
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY_PRESENT: boolean;
  };
  server: {
    JWT_SECRET_PRESENT: boolean;
    POSTGRES_URL_PRESENT: boolean;
    SENTRY_DSN_PRESENT: boolean;
  };
  timestamp: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<EnvCheckResult>) {
  // In production this endpoint is restricted. A valid secret header must be provided.
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.ENV_CHECK_SECRET;
    if (!secret) {
      return res.status(404).end();
    }
    const provided = req.headers['x-env-check-secret'];
    if (typeof provided !== 'string' || provided !== secret) {
      return res.status(403).json({} as any);
    }
  }

  const result: EnvCheckResult = {
    public: {
      NEXT_PUBLIC_API_URL:
        typeof process.env.NEXT_PUBLIC_API_URL === 'string'
          ? process.env.NEXT_PUBLIC_API_URL
          : undefined,
      NEXT_PUBLIC_SUPABASE_URL:
        typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string'
          ? process.env.NEXT_PUBLIC_SUPABASE_URL
          : undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_PRESENT: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    server: {
      JWT_SECRET_PRESENT: !!process.env.JWT_SECRET,
      POSTGRES_URL_PRESENT:
        !!process.env.POSTGRES_URL ||
        (!!process.env.POSTGRES_HOST && !!process.env.POSTGRES_DB && !!process.env.POSTGRES_USER),
      SENTRY_DSN_PRESENT: !!process.env.SENTRY_DSN,
      SUPABASE_SERVICE_ROLE_KEY_PRESENT: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(result);
}
