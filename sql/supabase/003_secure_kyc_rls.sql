-- 003_secure_kyc_rls.sql

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "kyc_own_records" ON public.kyc_submissions;

-- Create a more secure policy that ensures users can only access their own records
CREATE POLICY "kyc_own_records" ON public.kyc_submissions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
