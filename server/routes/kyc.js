const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const store = require('../utils/store');
const rateLimit = require('express-rate-limit');
const csrf = require('../middleware/csrf');
const logger = require('../utils/logger');

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

// Basic AV scanner: checks for EICAR test string when AV_ENABLED=true
function scanBuffer(buf) {
  try {
    if (process.env.AV_ENABLED !== 'true') return true;
    const txt = buf.toString('utf8');
    if (txt.includes('EICAR')) return false;
    return true;
  } catch (e) {
    logger.warn('AV scan failed, rejecting file');
    return false;
  }
}

// Public endpoint for KYC submission
// Accepts multipart form-data: idFront, idBack, proofAddress (files) and form fields
router.post(
  '/submit',
  authLimiter,
  csrf,
  upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'proofAddress', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // basic form fields
      const { fullName, dob, ssn, address, openSavings } = req.body;
      let { email } = req.body || {};

      if (!fullName || !dob || !ssn || !address) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // If email not provided, try to derive from Supabase access token (Authorization header or cookie)
      if (!email) {
        const authHeader = req.headers.authorization || '';
        let token = null;
        if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();
        if (!token && req.headers.cookie) {
          const cookieParser = require('cookie');
          const cookies = cookieParser.parse(req.headers.cookie || '');
          token =
            cookies['sb-access-token'] || cookies['sb:token'] || cookies['supabase-auth-token'];
        }

        if (token) {
          const supabase = getSupabaseServer();
          if (!supabase) return res.status(500).json({ error: 'Server storage not configured' });
          const { data, error } = await supabase.auth.getUser(token);
          if (!error && data && data.user) {
            email = data.user.email;
          }
        }
      }

      if (!email) {
        return res.status(400).json({ error: 'Missing required email' });
      }

      // minimal validation
      const files = req.files || {};
      const idFront = files.idFront && files.idFront[0];
      const idBack = files.idBack && files.idBack[0];
      const proof = files.proofAddress && files.proofAddress[0];

      if (!idFront || !idBack || !proof) {
        return res.status(400).json({ error: 'All 3 documents are required' });
      }

      // validate file types and AV-scan
      for (const f of [idFront, idBack, proof]) {
        if (!validFileType(f.mimetype)) {
          return res.status(400).json({ error: 'Invalid file type. Use images or pdfs.' });
        }
        if (!scanBuffer(f.buffer)) {
          return res.status(400).json({ error: 'File failed virus scan' });
        }
      }

      const supabase = getSupabaseServer();
      if (!supabase) return res.status(500).json({ error: 'Server storage not configured' });

      const submissionId = uuidv4();
      const bucket = process.env.SUPABASE_KYC_BUCKET || 'kyc';
      const timestamp = Date.now();

      // upload a file buffer to supabase storage
      async function uploadFile(file, field) {
        const ext =
          (file.originalname || '').split('.').pop() ||
          (file.mimetype === 'application/pdf' ? 'pdf' : 'jpg');
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

      // persist metadata to Supabase kyc_submissions table
      try {
        await store.insertKycSubmission({
          id: uuidv4(),
          submission_id: submissionId,
          user_id: req.user ? req.user.sub : null,
          email,
          full_name: fullName,
          dob: dob,
          ssn_last4: ssnLast4,
          address: address,
          open_savings: openSavings ? 1 : 0,
          id_front_path: idFrontPath,
          id_back_path: idBackPath,
          proof_path: proofPath,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        logger.error('Failed to persist KYC submission to Supabase', e && (e.message || e));
        return res.status(500).json({ error: 'Failed to store submission' });
      }

      return res.json({ success: true, submissionId });
    } catch (e) {
      logger.error('KYC submit error', e.message || e);
      return res.status(500).json({ error: 'Failed to process KYC submission' });
    }
  },
);

module.exports = router;
