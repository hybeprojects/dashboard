import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase environment not configured');
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const body = await req.json();
    const fromAccountId = body.fromAccountId ?? body.from_account_id ?? body.fromId ?? body.sender_account_id;
    const toAccountId = body.toAccountId ?? body.to_account_id ?? body.toId ?? body.receiver_account_id;
    const amount = body.amount;

    // Validation
    const MAX_TRANSFER_AMOUNT = 10000;
    const MIN_TRANSFER_AMOUNT = 1.0;
    const DAILY_TRANSFER_LIMIT = 50000;

    const amt = Number(amount);
    if (isNaN(amt) || amt < MIN_TRANSFER_AMOUNT || amt > MAX_TRANSFER_AMOUNT) {
      return new Response(JSON.stringify({ error: 'Invalid transfer amount' }), { status: 400 });
    }

    // get user
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const userId = userRes.user.id;

    // Check daily total
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { data: todays, error: tErr } = await supabase
      .from('transfers')
      .select('amount')
      .eq('sender_user_id', userId)
      .gte('created_at', startOfDay.toISOString());
    if (tErr)
      return new Response(JSON.stringify({ error: 'Failed to check transfer history' }), {
        status: 500,
      });
    const daySum = (todays || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    if (daySum + amt > DAILY_TRANSFER_LIMIT) {
      return new Response(JSON.stringify({ error: 'Daily transfer limit exceeded' }), {
        status: 400,
      });
    }

    // Check from account belongs to user and has enough balance (RLS should enforce ownership)
    const { data: fromAccs, error: faErr } = await supabase
      .from('accounts')
      .select('id,balance')
      .eq('id', fromAccountId)
      .maybeSingle();
    if (faErr)
      return new Response(JSON.stringify({ error: 'Failed to fetch account' }), { status: 500 });
    if (!fromAccs)
      return new Response(JSON.stringify({ error: 'From account not found' }), { status: 404 });
    if (Number(fromAccs.balance) < amt)
      return new Response(JSON.stringify({ error: 'Insufficient funds' }), { status: 400 });

    // Create transfer record (the DB should have RLS/triggers to perform balance updates atomically)
    const insertPayload = {
      id: crypto.randomUUID(),
      sender_user_id: userId,
      sender_account_id: fromAccountId,
      receiver_account_id: toAccountId ?? null,
      amount: amt,
      status: 'pending',
      transaction_reference: `TRF-${Date.now()}`,
      description: body.description || null,
    } as any;

    const { data: ins, error: insErr } = await supabase
      .from('transfers')
      .insert(insertPayload)
      .select()
      .maybeSingle();
    if (insErr)
      return new Response(
        JSON.stringify({ error: insErr.message || 'Failed to create transfer' }),
        { status: 500 },
      );

    return new Response(JSON.stringify({ success: true, transfer: ins }), { status: 200 });
  } catch (e: any) {
    console.error('Transfer function error', e?.message || e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
