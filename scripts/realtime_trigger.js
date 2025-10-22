#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function enqueueSyncJob(userId) {
  try {
    // avoid duplicate pending/processing jobs for same user
    const { data: existing } = await supabase
      .from('fineract_sync_queue')
      .select('id,status,created_at')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .limit(1);
    if (existing && existing.length) {
      console.log('Existing pending job for', userId, 'skipping enqueue');
      return;
    }

    const { error } = await supabase
      .from('fineract_sync_queue')
      .insert([{ user_id: userId, status: 'pending', created_at: new Date().toISOString() }]);
    if (error) {
      console.error('Failed to enqueue job', error);
    } else {
      console.log('Enqueued sync job for', userId);
    }
  } catch (e) {
    console.error('Enqueue error', e && e.message ? e.message : e);
  }
}

async function main() {
  console.log('Starting realtime trigger');
  const channel = supabase
    .channel('fineract-sync-triggers')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: 'fineract_client_id=neq.null',
      },
      (payload) => {
        try {
          const newRow = payload.new || payload.record || payload;
          const userId = newRow?.id || newRow?.user_id || newRow?.userId;
          if (userId) enqueueSyncJob(userId);
        } catch (e) {
          console.error('Realtime payload error', e && e.message ? e.message : e);
        }
      },
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });

  process.on('SIGINT', async () => {
    try {
      await supabase.removeChannel(channel);
    } catch (e) {}
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Realtime trigger fatal', err);
  process.exit(1);
});
