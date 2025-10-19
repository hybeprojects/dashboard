const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const db = require('../utils/db');
const adminAuth = require('../middleware/adminAuth');

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// List submissions (paginated)
router.get('/submissions', adminAuth, async (req, res) => {
  try {
    // basic admin protection: middleware must set req.user
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = (page - 1) * limit;

    const supabase = getSupabaseServer();
    if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

    const from = offset;
    const to = offset + limit - 1;
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return res.json({ submissions: data });
  } catch (e) {
    console.error('admin kyc list error', e.message || e);
    return res.status(500).json({ error: 'Failed to list submissions' });
  }
});

// Generate signed URLs for a submission's files
router.get('/signed/:submissionId', adminAuth, async (req, res) => {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) return res.status(500).json({ error: 'Supabase service client not configured' });

    const submissionId = req.params.submissionId;
    const { data: submission, error: subErr } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('submission_id', submissionId)
      .limit(1)
      .maybeSingle();
    if (subErr) throw subErr;
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const bucket = process.env.SUPABASE_KYC_BUCKET || 'kyc';
    const expiresIn = 60; // 60 seconds

    const urls = {};
    for (const key of ['id_front_path', 'id_back_path', 'proof_path']) {
      if (submission[key]) {
        const { data: d, error: e } = await supabase.storage.from(bucket).createSignedUrl(submission[key], expiresIn);
        if (e) throw e;
        urls[key] = d.signedURL;
      }
    }

    return res.json({ urls });
  } catch (e) {
    console.error('admin signed url error', e.message || e);
    return res.status(500).json({ error: 'Failed to create signed urls' });
  }
});

// Approve or reject submission
router.post('/decision', adminAuth, async (req, res) => {
  try {
    const { submissionId, decision, note } = req.body;
    if (!submissionId || !decision)
      return res.status(400).json({ error: 'Missing submissionId or decision' });
    if (!['approved', 'rejected'].includes(decision))
      return res.status(400).json({ error: 'Invalid decision' });

    const { data: updated, error: upErr } = await supabase
      .from('kyc_submissions')
      .update({ status: decision, review_note: note || null, reviewed_at: new Date().toISOString() })
      .eq('submission_id', submissionId)
      .select()
      .maybeSingle();
    if (upErr) throw upErr;
    return res.json({ success: true, updated });
  } catch (e) {
    console.error('admin decision error', e.message || e);
    return res.status(500).json({ error: 'Failed to update decision' });
  }
});

module.exports = router;
