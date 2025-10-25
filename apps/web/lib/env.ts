export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function getJwtSecret(): string {
  const fromJwt = process.env.JWT_SECRET;
  const fromNextAuth = process.env.NEXTAUTH_SECRET;
  const secret = fromJwt || fromNextAuth || '';
  if (!secret) throw new Error('Missing JWT secret. Set JWT_SECRET or NEXTAUTH_SECRET.');
  return secret;
}
