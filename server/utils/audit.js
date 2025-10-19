const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const logger = require('./logger');

let supabase = null;
function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service not configured for audit logging');
  supabase = createClient(url, key);
  return supabase;
}

async function logAudit({
  actor_id = null,
  actor_email = null,
  action,
  target_type = null,
  target_id = null,
  changes = null,
  ip = null,
  user_agent = null,
  metadata = null,
} = {}) {
  try {
    if (!action) throw new Error('action is required for audit log');
    const sb = getSupabase();
    const payload = {
      actor_id,
      actor_email,
      action,
      target_type,
      target_id,
      changes: changes || null,
      ip: ip || null,
      user_agent: user_agent || null,
      metadata: metadata || null,
    };
    const { data, error } = await sb.from('audit_logs').insert(payload).select().maybeSingle();
    if (error) {
      logger.error('Failed to insert audit log', error.message || error);
      return null;
    }
    return data;
  } catch (e) {
    logger.error('Audit log error', e && (e.message || e));
    return null;
  }
}

module.exports = { logAudit };
