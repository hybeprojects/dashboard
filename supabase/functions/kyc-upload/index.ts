import { serve } from 'https://deno.land/std@0.200.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const BUCKET = Deno.env.get('SUPABASE_KYC_BUCKET') || 'kyc-documents';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const form = await req.formData();
    const userRes = await supabase.auth.getUser();
    if (!userRes.data?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const userId = userRes.data.user.id;

    // Extract fields and files
    const fullName = form.get('fullName')?.toString() || '';
    const dob = form.get('dob')?.toString() || '';
    const email = form.get('email')?.toString() || '';

    const files: Array<{ field: string; file: File }> = [];
    for (const [key, val] of form.entries()) {
      if (val instanceof File) files.push({ field: key, file: val });
    }

    if (!files.length) return new Response(JSON.stringify({ error: 'No files uploaded' }), { status: 400 });

    // Validate files
    const uploads: Array<any> = [];
    for (const f of files) {
      if (!ALLOWED_MIME_TYPES.includes(f.file.type)) {
        return new Response(JSON.stringify({ error: 'Invalid file type' }), { status: 400 });
      }
      if (f.file.size > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({ error: 'File too large' }), { status: 400 });
      }

      // Magic bytes validation - simple check for PDF/JPEG/PNG signatures
      const buffer = await f.file.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 8));
      const sig = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const isPdf = sig.startsWith('25504446'); // %PDF
      const isPng = sig.startsWith('89504e47'); // PNG
      const isJpeg = sig.startsWith('ffd8ff'); // JPEG
      if (!isPdf && !isPng && !isJpeg) {
        return new Response(JSON.stringify({ error: 'File signature mismatch' }), { status: 400 });
      }

      const timestamp = Date.now();
      const documentType = f.field.replace(/[^a-z0-9-_]/gi, '_');
      const path = `users/${userId}/${documentType}_${timestamp}_${f.file.name}`;

      // Upload using user's credentials (RLS / storage policies should apply)
      const { data: upData, error: upErr } = await supabase.storage.from(BUCKET).upload(path, new Uint8Array(buffer), {
        contentType: f.file.type,
        upsert: false,
      });
      if (upErr) {
        return new Response(JSON.stringify({ error: 'Failed to upload file', details: upErr.message }), { status: 500 });
      }

      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || null;
      uploads.push({ field: f.field, path, publicUrl });
    }

    // Persist submission metadata
    const submission = {
      id: crypto.randomUUID(),
      user_id: userId,
      full_name: fullName,
      dob,
      email,
      files: uploads,
      status: 'submitted',
      created_at: new Date().toISOString(),
    } as any;

    const { data: insertRes, error: insertErr } = await supabase.from('kyc_submissions').insert(submission).select().maybeSingle();
    if (insertErr) return new Response(JSON.stringify({ error: 'Failed to store submission' }), { status: 500 });

    return new Response(JSON.stringify({ success: true, submission: insertRes }), { status: 200 });
  } catch (e: any) {
    console.error('KYC upload error', e?.message || e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
