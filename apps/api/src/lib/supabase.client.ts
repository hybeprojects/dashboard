import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url) {
  throw new Error(
    'SUPABASE_URL (server) is required for server-side Supabase client. Set SUPABASE_URL in your server environment.',
  );
}
if (!key) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase client');
}

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
});
