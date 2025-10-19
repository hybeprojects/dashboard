import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SERVICE_ROLE) console.warn('SUPABASE_SERVICE_ROLE_KEY not set; admin actions will fail');

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    // client with user's auth to verify admin status
    const userClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const u = await userClient.auth.getUser();
    if (!u.data?.user)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const userId = u.data.user.id;

    // check admin flag in profiles table (assumes 'profiles' has is_admin boolean)
    const { data: profile, error: pErr } = await userClient
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();
    if (pErr)
      return new Response(JSON.stringify({ error: 'Failed to load profile' }), { status: 500 });
    if (!profile || !profile.is_admin)
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    // Use service role client for privileged updates
    if (!SERVICE_ROLE)
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
    const adminClient = createClient(SUPABASE_URL!, SERVICE_ROLE);

    const body = await req.json();
    const { action, payload } = body;

    if (!action) return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400 });

    // Example actions: approve_kyc, adjust_balance
    if (action === 'approve_kyc') {
      const { submissionId, approved, note } = payload || {};
      if (!submissionId)
        return new Response(JSON.stringify({ error: 'Missing submissionId' }), { status: 400 });

      const { data: upd, error: updErr } = await adminClient
        .from('kyc_submissions')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: userId,
          review_note: note,
        })
        .eq('id', submissionId)
        .select()
        .maybeSingle();
      if (updErr)
        return new Response(
          JSON.stringify({ error: 'Failed to update submission', details: updErr.message }),
          { status: 500 },
        );

      // audit log
      await adminClient
        .from('audit_logs')
        .insert({
          id: crypto.randomUUID(),
          actor_id: userId,
          action: 'kyc_decision',
          target_type: 'kyc_submission',
          target_id: submissionId,
          metadata: { approved },
        });

      return new Response(JSON.stringify({ success: true, submission: upd }), { status: 200 });
    }

    if (action === 'adjust_balance') {
      const { accountId, delta } = payload || {};
      if (!accountId || typeof delta !== 'number')
        return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });

      // perform balance adjustment with service role
      // This assumes a simple update; in production use stored procedures for ledger integrity
      const { data: acc, error: accErr } = await adminClient
        .from('accounts')
        .select('id,balance')
        .eq('id', accountId)
        .maybeSingle();
      if (accErr)
        return new Response(JSON.stringify({ error: 'Failed to load account' }), { status: 500 });
      if (!acc)
        return new Response(JSON.stringify({ error: 'Account not found' }), { status: 404 });

      const newBalance = Number(acc.balance || 0) + delta;
      const { data: up, error: upErr } = await adminClient
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)
        .select()
        .maybeSingle();
      if (upErr)
        return new Response(JSON.stringify({ error: 'Failed to update balance' }), { status: 500 });

      await adminClient
        .from('audit_logs')
        .insert({
          id: crypto.randomUUID(),
          actor_id: userId,
          action: 'adjust_balance',
          target_type: 'account',
          target_id: accountId,
          metadata: { delta },
        });

      return new Response(JSON.stringify({ success: true, account: up }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (e: any) {
    console.error('Admin actions error', e?.message || e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
