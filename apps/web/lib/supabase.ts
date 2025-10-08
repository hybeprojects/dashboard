import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!url || !anon) {
  console.warn('NEXT_PUBLIC_SUPABASE_* env variables are missing');
}

export const supabase = createClient(url, anon, { auth: { persistSession: false } });
