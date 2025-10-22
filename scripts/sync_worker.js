#!/usr/bin/env node
// Worker that listens for new rows in fineract_sync_queue and processes them.
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

async function processJob(supabase, job) {
  const userId = job.user_id;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,fineract_client_id')
    .eq('id', userId)
    .single();
  if (!profile) {
    await supabase
      .from('fineract_sync_queue')
      .update({ status: 'failed', updated_at: new Date().toISOString(), error: 'profile_missing' })
      .eq('id', job.id);
    return;
  }
  const clientId = profile.fineract_client_id;
  const fineractUrl = process.env.FINERACT_URL || '';
  const username = process.env.FINERACT_USERNAME;
  const password = process.env.FINERACT_PASSWORD;
  const tenant = process.env.FINERACT_TENANT_ID || process.env.FINERACT_TENANT;
  const axiosConfig = { auth: { username, password }, headers: {}, timeout: 10000 };
  if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

  try {
    if (!clientId) throw new Error('no fineract client id');
    const r = await axios.get(
      `${fineractUrl.replace(/\/$/, '')}/clients/${clientId}/accounts`,
      axiosConfig,
    );
    const accounts = r.data;
    await supabase
      .from('accounts')
      .upsert({ user_id: userId, data: accounts }, { onConflict: 'user_id' });
    await supabase
      .from('fineract_sync_queue')
      .update({ status: 'done', updated_at: new Date().toISOString(), result: accounts })
      .eq('id', job.id);
    console.log('Processed job', job.id);
  } catch (e) {
    const errMsg = e && e.message ? e.message : String(e);
    console.warn('Job failed', job.id, errMsg);

    // retry handling
    try {
      // read latest attempt_count if present
      const attempts = typeof job.attempt_count === 'number' ? job.attempt_count : 0;
      const maxAttempts = parseInt(process.env.SYNC_MAX_ATTEMPTS || '5', 10);
      const nextAttempt = attempts + 1;

      const updatePayload = {
        status: nextAttempt >= maxAttempts ? 'failed' : 'pending',
        updated_at: new Date().toISOString(),
        error: errMsg,
      };
      // attempt to set attempt_count if the column exists
      try {
        updatePayload.attempt_count = nextAttempt;
      } catch (_) {
        // ignore
      }

      await supabase.from('fineract_sync_queue').update(updatePayload).eq('id', job.id);
      if (nextAttempt < maxAttempts) {
        console.log(`Scheduled retry ${nextAttempt}/${maxAttempts} for job ${job.id}`);
      } else {
        console.log(`Job ${job.id} failed after ${nextAttempt} attempts`);
      }
    } catch (e2) {
      console.error('Failed to update job retry state', e2 && e2.message ? e2.message : e2);
    }
  }
}

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  console.log('Starting sync worker');

  // Polling loop as a safe fallback if realtime not configured
  while (true) {
    try {
      const { data: jobs } = await supabase
        .from('fineract_sync_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(10)
        .order('created_at', { ascending: true });
      if (jobs && jobs.length) {
        for (const job of jobs) {
          // mark processing
          await supabase
            .from('fineract_sync_queue')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', job.id);
          await processJob(supabase, job);
        }
      }
    } catch (e) {
      console.error('Worker error', e && e.message ? e.message : e);
    }
    // wait 5 seconds
    await new Promise((r) => setTimeout(r, 5000));
  }
}

main().catch((err) => {
  console.error('Fatal', err);
  process.exit(1);
});
