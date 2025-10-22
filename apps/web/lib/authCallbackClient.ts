/**
 * Example client-side code to POST a Supabase access token to the server-side callback
 * Call this after an OAuth redirect or when you obtain an access token client-side.
 */
export async function postAccessTokenToCallback(accessToken: string) {
  if (!accessToken) throw new Error('accessToken required');
  const res = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || 'Callback failed');
  }
  return res.json();
}
