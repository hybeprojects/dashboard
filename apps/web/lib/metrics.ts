import { getServiceRoleClient } from './supabase/api';

export async function recordMetric(kind: string, payload: Record<string, any> = {}) {
  try {
    // Attempt to write to a system_metrics table if available
    const svc = getServiceRoleClient();
    if (svc) {
      try {
        await svc.from('system_metrics').insert({ kind, payload, created_at: new Date().toISOString() });
        return;
      } catch (e) {
        // ignore insert errors
        console.warn('Metrics insert failed', e && (e as any).message ? (e as any).message : e);
      }
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
