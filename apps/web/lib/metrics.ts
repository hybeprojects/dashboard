import { getServiceRoleClient } from './supabase/api';

import { getDb } from './db';

export async function recordMetric(kind: string, payload: Record<string, any> = {}) {
  try {
    const db = await getDb();
    try {
      await db.run('INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?, ?)',
        `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        null,
        kind,
        'metric',
        null,
        JSON.stringify(payload)
      );
      return;
    } catch (e) {
      // ignore db write errors
    }
  } catch (e) {
    // ignore
  }
  // Fallback to console
  try {
    console.log('METRIC', kind, JSON.stringify(payload));
  } catch (e) {
    // no-op
  }
}
