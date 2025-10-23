-- 004_secure_audit_logs.sql

-- Revoke all permissions from the authenticated role
REVOKE ALL ON public.audit_logs FROM authenticated;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "audit_logs_all_access" ON public.audit_logs;

-- Create a restrictive policy that denies all access by default
-- All operations should be performed using the Supabase service role key, which bypasses RLS.
CREATE POLICY "audit_logs_service_role_only" ON public.audit_logs
  FOR ALL
  USING (false)
  WITH CHECK (false);
