import { ensureFineractClient } from './fineract';

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Missing credentials' };

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!res.ok) return { error: body?.error || 'Sign in failed' };

    // best-effort ensure fineract mapping
    try {
      const user = body?.user;
      if (user) {
        const firstName = user?.user_metadata?.first_name || user?.firstName || '';
        const lastName = user?.user_metadata?.last_name || user?.lastName || '';
        ensureFineractClient(user.id, { firstName, lastName, email: user.email }).catch(() => {});
      }
    } catch (e) {
      // ignore
    }

    return { data: body };
  } catch (e: any) {
    return { error: e?.message || 'Network error' };
  }
}

export async function getBankingData(token?: string) {
  if (token) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const resp = await fetch(`${baseUrl}/api/banking`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error('Failed to fetch banking data');
    return resp.json();
  }

  const res = await fetch('/api/banking', { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Authentication required');
    throw new Error(`Failed to fetch banking data: ${res.status}`);
  }
  return res.json();
}

export async function triggerFineractSync(userId: string) {
  try {
    // Best-effort: call internal API to schedule sync
    const res = await fetch('/api/queue/sync-fineract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return { success: false };
    return { success: true };
  } catch (e) {
    console.error('Trigger sync error:', e);
    return { success: false, error: e };
  }
}
