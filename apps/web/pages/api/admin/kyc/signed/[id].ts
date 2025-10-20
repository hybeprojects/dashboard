import type { NextApiRequest, NextApiResponse } from 'next';
import getServerSupabase from '../../../../api/_serverSupabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerSupabase();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

  try {
    const cookiesHeader = req.headers.cookie || '';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cookie = require('cookie');
    const cookies = cookiesHeader ? cookie.parse(cookiesHeader) : {};
    const token =
      cookies['sb-access-token'] || cookies['supabase-auth-token'] || cookies['sb:token'];

    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token as string);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });
    const userId = userData.user.id;

    // Check admin flag
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) return res.status(500).json({ error: 'Failed to load profile' });
    if (!profile || !profile.is_admin) return res.status(403).json({ error: 'Forbidden' });

    const submissionId = req.query.id as string;
    if (!submissionId) return res.status(400).json({ error: 'Missing id' });

    const { data: sub, error: subErr } = await supabase
      .from('kyc_submissions')
      .select('files')
      .eq('id', submissionId)
      .maybeSingle();

    if (subErr) return res.status(500).json({ error: 'Failed to load submission' });
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    const files = sub.files || [];
    const bucket = process.env.SUPABASE_KYC_BUCKET || 'kyc-documents';
    const urls: Record<string, string | null> = {};

    for (const f of files) {
      const path = f.path || f.file || null;
      if (!path) continue;
      try {
        const { data: signed, error: signErr } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 60);
        if (signErr) {
          urls[f.field || path] = null;
        } else {
          urls[f.field || path] = signed.signedUrl || null;
        }
      } catch (e) {
        urls[f.field || path] = null;
      }
    }

    return res.status(200).json({ urls });
  } catch (e: any) {
    console.error('admin/kyc/signed error', e?.message || e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
