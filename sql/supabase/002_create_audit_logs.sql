-- 002_create_audit_logs.sql

-- Create audit_logs table to record admin and important actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  changes jsonb,
  ip text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON public.audit_logs (actor_id);

-- Enable RLS to allow fine-grained control if desired
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Example policy: allow inserts only via service role or server-side functions
-- In Supabase, the service_role key bypasses RLS; keep the table restricted for clients.

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
