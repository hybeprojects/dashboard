#!/usr/bin/env node
// Simple background worker to sync Fineract accounts on demand.
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const fineractUrl = process.env.FINERACT_URL || '';
  const username = process.env.FINERACT_USERNAME;
  const password = process.env.FINERACT_PASSWORD;
  const tenant = process.env.FINERACT_TENANT_ID || process.env.FINERACT_TENANT;

  const axiosConfig = { auth: { username, password }, headers: {}, timeout: 10000 };
  if (tenant) axiosConfig.headers['Fineract-Platform-TenantId'] = tenant;

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, fineract_client_id')
    .not('fineract_client_id', 'is', null);
  if (error) {
    console.error('Failed to fetch profiles', error);
    process.exit(1);
  }
  for (const p of profiles) {
    try {
      const clientId = p.fineract_client_id;
      if (!clientId) continue;
      const accountsUrl = `${fineractUrl.replace(/\/$/, '')}/clients/${clientId}/accounts`;
      const r = await axios.get(accountsUrl, axiosConfig);
      const accounts = r?.data || null;
      try {
        await supabase
          .from('accounts')
          .upsert({ user_id: p.id, data: accounts }, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('Failed to upsert accounts for', p.id, e.message || e);
      }
      console.log('Synced accounts for', p.id);
    } catch (e) {
      console.warn('Sync failed for', p.id, e.message || e);
    }
  }
  console.log('Done');
}

main().catch((err) => {
  console.error('Fatal error', err);
  process.exit(1);
});
