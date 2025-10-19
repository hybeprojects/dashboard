/*
  Migrate existing MySQL kyc_submissions to Supabase Postgres.
  Run with: node server/scripts/migrate_kyc_to_supabase.js
  Requirements: server utils/db.js configured to connect to MySQL, and SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL set.
*/

const db = require('../utils/db');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function migrate() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Supabase service not configured');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  try {
    // fetch from MySQL
    const [rows] = await db.query('SELECT * FROM kyc_submissions ORDER BY created_at ASC');
    console.log('Found', rows.length, 'kyc records to migrate');

    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      batches.push(rows.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const payload = batch.map((r) => ({
        id: r.id || r.uuid || require('uuid').v4(),
        submission_id: r.submission_id || require('uuid').v4(),
        user_id: r.user_id || null,
        email: r.email || null,
        full_name: r.full_name || r.fullName || null,
        dob: r.dob ? new Date(r.dob).toISOString().slice(0, 10) : null,
        ssn_last4: r.ssn_last4 || r.ssnLast4 || null,
        address: r.address || null,
        open_savings: r.open_savings === 1 || r.open_savings === true ? true : false,
        id_front_path: r.id_front_path || r.idFrontPath || null,
        id_back_path: r.id_back_path || r.idBackPath || null,
        proof_path: r.proof_path || r.proofPath || null,
        status: r.status || 'pending',
        review_note: r.review_note || null,
        created_at: r.created_at || new Date().toISOString(),
        reviewed_at: r.reviewed_at || null,
      }));

      // Use upsert to avoid duplicate primary key errors; onConflict 'id'
      const { data: inserted, error } = await supabase
        .from('kyc_submissions')
        .upsert(payload, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('Batch upsert failed', error.message || error);
        // fallback to inserting one-by-one to identify failing rows
        for (const p of payload) {
          const { data: d, error: e } = await supabase
            .from('kyc_submissions')
            .upsert(p, { onConflict: 'id' })
            .select();
          if (e) console.error('Failed to migrate submission', p.submission_id, e.message || e);
          else console.log('Migrated submission', p.submission_id);
        }
      } else {
        for (const p of payload) console.log('Migrated submission', p.submission_id);
      }
    }

    console.log('Migration complete');
  } catch (e) {
    console.error('Migration failed', e && (e.message || e));
  }
}

migrate().catch((e) => {
  console.error('Migration fatal error', e && (e.message || e));
  process.exit(1);
});
