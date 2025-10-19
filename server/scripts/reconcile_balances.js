/*
Compare balances between Supabase and Fineract and sync Supabase to Fineract values.
Run with: node server/scripts/reconcile_balances.js
Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FINERACT_URL, FINERACT_USERNAME, FINERACT_PASSWORD, FINERACT_TENANT_ID
*/

const { createClient } = require('@supabase/supabase-js');
const store = require('../utils/store');
const fineractAPI = require('../utils/fineractAPI');
const logger = require('../utils/logger');
require('dotenv').config();

async function run() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) {
    logger.error('Supabase not configured');
    process.exit(1);
  }
  const supabase = createClient(sbUrl, sbKey);

  // Fetch all app_users that have an account mapping
  const { data: users, error: usersErr } = await supabase
    .from('app_users')
    .select('*')
    .not('account_id', 'is', null);
  if (usersErr) throw usersErr;

  const report = { checked: 0, synced: 0, errors: [] };

  for (const u of users || []) {
    report.checked++;
    try {
      const acctRef = u.account_id || u.fineract_account_id || u.accountId;
      if (!acctRef) {
        report.errors.push({ user: u.id, message: 'no fineract account id' });
        continue;
      }

      // Get balance from Fineract
      let fineractBal = null;
      try {
        fineractBal = await fineractAPI.getAccountBalance(acctRef);
      } catch (e) {
        report.errors.push({ user: u.id, account: acctRef, error: e && (e.message || e) });
        continue;
      }

      if (fineractBal == null) {
        report.errors.push({ user: u.id, account: acctRef, message: 'no fineract balance' });
        continue;
      }

      // Try find Supabase account row (accounts table) related to this user or account reference
      let sbAccount = null;
      try {
        // 1. Try match by id (if accounts.id equals acctRef)
        let q = await supabase.from('accounts').select('*').eq('id', acctRef).limit(1).maybeSingle();
        if (!q.error && q.data) sbAccount = q.data;
        // 2. Try match by user_id
        if (!sbAccount) {
          q = await supabase.from('accounts').select('*').eq('user_id', u.id).limit(1).maybeSingle();
          if (!q.error && q.data) sbAccount = q.data;
        }
        // 3. Try app_users.balance column
        if (!sbAccount) {
          const { data: au, error: ae } = await supabase
            .from('app_users')
            .select('balance')
            .eq('id', u.id)
            .limit(1)
            .maybeSingle();
          if (!ae && au) sbAccount = { source: 'app_users', balance: au.balance };
        }
      } catch (e) {
        logger.warn('Error querying supabase account', e && (e.message || e));
      }

      const sbBalanceRaw = sbAccount ? (sbAccount.balance ?? sbAccount.balance) : null;
      const sbBalance = sbBalanceRaw != null ? Number(sbBalanceRaw) : null;

      // Compare with tolerance of 1 cent
      const diff = sbBalance == null ? true : Math.abs(Number(fineractBal) - sbBalance) > 0.009;
      if (diff) {
        // Sync: update Supabase to reflect Fineract balance
        try {
          if (sbAccount && sbAccount.source === 'app_users') {
            const { data: up, error: upErr } = await supabase
              .from('app_users')
              .update({ balance: fineractBal })
              .eq('id', u.id)
              .select()
              .maybeSingle();
            if (upErr) throw upErr;
          } else if (sbAccount) {
            const { data: up, error: upErr } = await supabase
              .from('accounts')
              .update({ balance: fineractBal })
              .eq('id', sbAccount.id)
              .select()
              .maybeSingle();
            if (upErr) throw upErr;
          } else {
            // no account row to update: attempt to insert into accounts table if possible
            try {
              const newRow = {
                id: acctRef,
                user_id: u.id,
                balance: fineractBal,
                currency: u.currency || 'USD',
                created_at: new Date().toISOString(),
              };
              const { data: ins, error: insErr } = await supabase.from('accounts').insert(newRow).select().maybeSingle();
              if (insErr) throw insErr;
            } catch (e) {
              // if unable to insert, fallback to updating app_users.balance field (best-effort)
              const { data: up, error: upErr } = await supabase
                .from('app_users')
                .update({ balance: fineractBal })
                .eq('id', u.id)
                .select()
                .maybeSingle();
              if (upErr) throw upErr;
            }
          }
          report.synced++;
          // Log a reconciliation audit entry if audit log util available
          try {
            const audit = require('../utils/audit');
            await audit.logAudit({
              actor_id: null,
              actor_email: 'system@reconcile',
              action: 'reconcile_balance_sync',
              target_type: 'account',
              target_id: acctRef,
              changes: { previous: sbBalance, updated: Number(fineractBal) },
              ip: null,
              user_agent: null,
            });
          } catch (e) {
            logger.warn('Failed to write audit for reconciliation', e && (e.message || e));
          }
        } catch (e) {
          report.errors.push({ user: u.id, account: acctRef, error: e && (e.message || e) });
        }
      }
    } catch (e) {
      report.errors.push({ user: u.id, error: e && (e.message || e) });
    }
  }

  // Write report to disk
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const outDir = path.join(__dirname, '..', 'backups');
    await fs.mkdir(outDir, { recursive: true });
    const filePath = path.join(outDir, `reconcile_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(filePath, JSON.stringify({ generated_at: new Date().toISOString(), report }, null, 2), 'utf8');
    logger.info('Reconciliation report written to', filePath);
  } catch (e) {
    logger.warn('Failed to write reconciliation report', e && (e.message || e));
  }

  console.log('Reconciliation complete', report);
}

if (require.main === module) {
  run().catch((e) => {
    console.error('Reconcile balances failed', e && (e.message || e));
    process.exit(1);
  });
}

module.exports = { run };
