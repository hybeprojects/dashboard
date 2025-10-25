import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../_serverSupabase';
import { getUserFromRequest } from '../../../lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) return res.status(500).json({ error: 'Failed to load profile' });
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const action = (req.query.action as string) || '';
    const actorEmail = (req.query.actor_email as string) || '';
    const targetId = (req.query.target_id as string) || '';
    const targetType = (req.query.target_type as string) || '';
    const search = (req.query.search as string) || '';
    const start = (req.query.start as string) || '';
    const end = (req.query.end as string) || '';

    let q = supabase.from('audit_logs').select('*', { count: 'exact' });

    if (action) q = q.eq('action', action);
    if (actorEmail) q = q.ilike('actor_email', `%${actorEmail}%`);
    if (targetId) q = q.ilike('target_id', `%${targetId}%`);
    if (targetType) q = q.eq('target_type', targetType);
    if (start) q = q.gte('created_at', start);
    if (end) q = q.lte('created_at', end);
    if (search) {
      // Free-text search across common columns
      q = q.or(
        [
          `action.ilike.%${search}%`,
          `actor_email.ilike.%${search}%`,
          `target_type.ilike.%${search}%`,
          `target_id.ilike.%${search}%`,
          `ip.ilike.%${search}%`,
          `user_agent.ilike.%${search}%`,
        ].join(',')
      );
    }

    q = q.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await q;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ logs: data || [], page, limit, total: count || 0 });
  } catch (e: any) {
    console.error('admin/audit-logs error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
