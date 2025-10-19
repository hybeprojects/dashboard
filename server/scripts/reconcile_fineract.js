/*
  Simple Fineract <> Supabase reconciliation worker.
  Run with: node server/scripts/reconcile_fineract.js
  Requires environment variables: FINERACT_URL, FINERACT_USERNAME, FINERACT_PASSWORD, FINERACT_TENANT_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
*/

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const fineractUrl = process.env.FINERACT_URL;
  const username = process.env.FINERACT_USERNAME;
  const password = process.env.FINERACT_PASSWORD;
  const tenantId = process.env.FINERACT_TENANT_ID;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!fineractUrl || !username || !password || !tenantId) {
    console.error('Fineract credentials are not configured. Set FINERACT_URL, FINERACT_USERNAME, FINERACT_PASSWORD, FINERACT_TENANT_ID');
    process.exit(1);
  }
  if (!sbUrl || !sbKey) {
    console.error('Supabase not configured');
    process.exit(1);
  }

  const supabase = createClient(sbUrl, sbKey);

  // Basic auth for Fineract
  const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

  // Fetch clients from Fineract (paged). The demo API exposes /clients
  let page = 0;
  let pageSize = 100;
  let total = 0;
  const report = { checked: 0, updated: 0, created: 0, errors: [] };

  while (true) {
    const url = `${fineractUrl.replace(/\/$/, '')}/clients?limit=${pageSize}&offset=${page * pageSize}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: auth,
        'X-Tenant-Identifier': tenantId,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) {
      console.error('Failed to fetch clients from Fineract', resp.status, await resp.text());
      process.exit(1);
    }
    const data = await resp.json();
    const clients = data.pageItems || data; // adapt to different response shapes
    if (!clients || clients.length === 0) break;

    for (const c of clients) {
      try {
        const fineractId = c.id || c.clientId || c.identifier;
        const accountRef = String(fineractId);
        // Map relevant fields
        const record = {
          id: null,
          fineract_client_id: accountRef,
          fineract_display_name: c.displayName || c.accountNo || c.name || null,
          email: c.email || (c.contactDetails && c.contactDetails.email) || null,
          phone: c.mobileNo || null,
          // add other mappings as needed
        };

        // Try to find matching user by fineract_client_id
        const { data: existing, error: selErr } = await supabase
          .from('app_users')
          .select('*')
          .eq('fineract_client_id', accountRef)
          .limit(1)
          .maybeSingle();
        if (selErr) throw selErr;

        if (existing) {
          // update if needed
          const patch = {};
          if (record.fineract_display_name && record.fineract_display_name !== existing.fineract_display_name) patch.fineract_display_name = record.fineract_display_name;
          if (record.email && record.email !== existing.email) patch.email = record.email;
          if (record.phone && record.phone !== existing.phone) patch.phone = record.phone;
          if (Object.keys(patch).length > 0) {
            const { data: up, error: upErr } = await supabase
              .from('app_users')
              .update(patch)
              .eq('id', existing.id)
              .select()
              .maybeSingle();
            if (upErr) throw upErr;
            report.updated++;
          }
        } else {
          // create a stub user
          const payload = {
            id: require('uuid').v4(),
            fineract_client_id: accountRef,
            fineract_display_name: record.fineract_display_name,
            email: record.email,
            phone: record.phone,
            created_at: new Date().toISOString(),
          };
          const { data: ins, error: insErr } = await supabase.from('app_users').insert(payload).select().maybeSingle();
          if (insErr) throw insErr;
          report.created++;
        }
        report.checked++;
      } catch (e) {
        report.errors.push({ client: c, error: e && (e.message || e) });
      }
    }

    if (clients.length < pageSize) break;
    page++;
  }

  console.log('Reconciliation report:', report);
}

if (require.main === module) {
  run().catch((e) => {
    console.error('Reconcile failed', e && (e.message || e));
    process.exit(1);
  });
}
