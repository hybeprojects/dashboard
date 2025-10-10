const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('Supabase URL or service role key not found in env. Supabase persistence disabled.');
  module.exports = null;
} else {
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  module.exports = supabase;
}
