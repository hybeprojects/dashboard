const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const rateLimit = require('express-rate-limit');

// Memory storage to avoid writing files to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Utility: initialize Supabase service client
function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function validFileType(mimetype) {
  return mimetype.startsWith('image/') || mimetype === 'application/pdf';
}

// Public endpoint for KYC submission
// Accepts multipart form-data: idFront, idBack, proofAddress (files) and form fields
router.post('/submit', authLimiter, upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'proofAddress', maxCount: 1 },
]), async (req, res) => {
  try {
    // basic form fields
    const { fullName, dob, ssn, address, openSavings, email } = req.body;

    if (!fullName || !dob || !ssn || !address || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // minimal validation
    const files = req.files || {};
    const idFront = files.idFront && files.idFront[0];
    const idBack = files.idBack && files.idBack[0];
    const proof = files.proofAddress && files.proofAddress[0];

    if (!idFront || !idBack || !proof) {
      return res.status(400).json({ error: 'All 3 documents are required' });
    }

    // validate file types
    for (const f of [idFront, idBack, proof]) {
      if (!validFileType(f.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Use images or pdfs.' });
      }
    }

    const supabase = getSupabaseServer();
    if (!supabase) return res.status(500).json({ error: 'Server storage not configured' });

    const submissionId = uuidv4();
    const bucket = process.env.SUPABASE_KYC_BUCKET || 'kyc';
    const timestamp = Date.now();

    // upload a file buffer to supabase storage
    async function uploadFile(file, field) {
      const ext = (file.originalname || '').split('.').pop() || (file.mimetype === 'application/pdf' ? 'pdf' : 'jpg');
      const path = `${submissionId}/${field}_${timestamp}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (error) throw error;
      return path;
    }

    const idFrontPath = await uploadFile(idFront, 'idFront');
    const idBackPath = await uploadFile(idBack, 'idBack');
    const proofPath = await uploadFile(proof, 'proofAddress');

    // store metadata in DB
    // Avoid storing raw SSN: store last 4 digits only
    const ssnStr = String(ssn || '');
    const ssnLast4 = ssnStr.slice(-4);

    const insertSql = `INSERT INTO kyc_submissions (id, submission_id, email, full_name, dob, ssn_last4, address, open_savings, id_front_path, id_back_path, proof_path, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    await db.query(insertSql, [uuidv4(), submissionId, email, fullName, dob, ssnLast4, address, openSavings ? 1 : 0, idFrontPath, idBackPath, proofPath, 'pending']);

    return res.json({ success: true, submissionId });
  } catch (e) {
    console.error('KYC submit error', e.message || e);
    return res.status(500).json({ error: 'Failed to process KYC submission' });
  }
});

module.exports = router;
