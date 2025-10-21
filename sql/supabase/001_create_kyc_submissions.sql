-- 001_create_kyc_submissions.sql

-- Create kyc_submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid PRIMARY KEY,
  submission_id uuid UNIQUE NOT NULL,
  user_id uuid,
  email text,
  full_name text NOT NULL,
  dob date,
  ssn_last4 text,
  address text,
  open_savings boolean DEFAULT false,
  id_front_path text,
  id_back_path text,
  proof_path text,
  status text DEFAULT 'pending',
  review_note text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Optional: create an index on user_id and submission_id
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submission_id ON public.kyc_submissions (submission_id);

-- Enable Row Level Security
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to SELECT/INSERT/UPDATE/DELETE their own submissions
CREATE POLICY "kyc_own_records" ON public.kyc_submissions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: Admin operations should be performed using the Supabase service role key which bypasses RLS.
-- If admin users are represented by claims (e.g., is_admin), additional policies can be created to allow access.

-- Example: allow select if jwt has is_admin=true (uncomment and adapt if using custom claims)
-- CREATE POLICY "kyc_admin_read" ON public.kyc_submissions
--   FOR SELECT
--   USING (coalesce((auth.jwt()).claims->>'is_admin','') = 'true');

-- Grant minimal privileges to authenticated role (optional; Supabase usually manages this)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_submissions TO authenticated;
