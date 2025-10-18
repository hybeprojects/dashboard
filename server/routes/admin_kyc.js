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

    const [rows] = await db.query(
      'SELECT * FROM kyc_submissions ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset],
    );
    return res.json({ submissions: rows });
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
    const [rows] = await db.query('SELECT * FROM kyc_submissions WHERE submission_id = ? LIMIT 1', [
      submissionId,
    ]);
    const submission = rows && rows[0];
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const bucket = process.env.SUPABASE_KYC_BUCKET || 'kyc';
    const expiresIn = 60; // 60 seconds

    const urls = {};
    for (const key of ['id_front_path', 'id_back_path', 'proof_path']) {
      if (submission[key]) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(submission[key], expiresIn);
        if (error) throw error;
        urls[key] = data.signedURL;
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

    await db.query(
      'UPDATE kyc_submissions SET status = ?, review_note = ?, reviewed_at = NOW() WHERE submission_id = ?',
      [decision, note || null, submissionId],
    );
    return res.json({ success: true });
  } catch (e) {
    console.error('admin decision error', e.message || e);
    return res.status(500).json({ error: 'Failed to update decision' });
  }
});

module.exports = router;
