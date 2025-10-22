import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../../_serverSupabase';
import cookie from 'cookie';
const crypto = require('crypto');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  try {
    const cookiesHeader = req.headers.cookie || '';
    const cookies = cookiesHeader ? cookie.parse(cookiesHeader) : {};
    const token =
      cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'];

    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token as string);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = userData.user.id;

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) return res.status(500).json({ error: 'Failed to load profile' });
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const { submissionId, decision, note } = req.body || {};
    if (!submissionId) return res.status(400).json({ error: 'Missing submissionId' });
    if (decision !== 'approved' && decision !== 'rejected')
      return res.status(400).json({ error: 'Invalid decision' });

    const status = decision === 'approved' ? 'approved' : 'rejected';

    const { data: upd, error: updErr } = await supabase
      .from('kyc_submissions')
      .update({
        status,
        reviewed_by: userId,
        review_note: note,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .maybeSingle();

    if (updErr) return res.status(500).json({ error: updErr.message });

    // insert audit log if table exists (best-effort)
    try {
      await supabase.from('audit_logs').insert({
        id: crypto.randomUUID(),
        actor_id: userId,
        action: 'kyc_decision',
        target_type: 'kyc_submission',
        target_id: submissionId,
        metadata: { decision, note },
      });
    } catch (e) {
      // ignore audit log errors
    }

    return res.status(200).json({ success: true, submission: upd });
  } catch (e: any) {
    console.error('admin/kyc/decision error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
