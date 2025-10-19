/*
  Backup specified Supabase tables to JSON files and write checksums.
  Run with: node server/scripts/backup_tables.js
  Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
*/
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

async function run() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) {
    console.error('Supabase not configured');
    process.exit(1);
  }
  const supabase = createClient(sbUrl, sbKey);
  const tables = ['kyc_submissions', 'app_users', 'audit_logs'];
  const outDir = path.join(__dirname, '..', 'backups');
  await fs.mkdir(outDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*');
      if (error) {
        console.error('Failed to export table', t, error.message || error);
        continue;
      }
      const filePath = path.join(outDir, `${timestamp}_${t}.json`);
      const json = JSON.stringify(data || [], null, 2);
      await fs.writeFile(filePath, json, 'utf8');
      const hash = crypto.createHash('sha256').update(json, 'utf8').digest('hex');
      await fs.writeFile(filePath + '.sha256', hash, 'utf8');
      console.log('Backed up', t, '->', filePath);
    } catch (e) {
      console.error('Backup error for table', t, e && (e.message || e));
    }
  }
}

module.exports = { run };

if (require.main === module) {
  run().catch((e) => {
    console.error('Backup failed', e && (e.message || e));
    process.exit(1);
  });
}
