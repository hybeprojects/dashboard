-- Run these statements in Supabase SQL editor or via migrations

-- users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text UNIQUE NOT NULL,
  password_hash text,
  kyc_status text,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  account_number text UNIQUE NOT NULL,
  balance numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric NOT NULL,
  recipient_account text,
  status text DEFAULT 'pending',
  timestamp timestamptz DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text,
  user_id uuid,
  ip_address text,
  timestamp timestamptz DEFAULT now()
);

-- Soft delete helper example
CREATE POLICY "users_owner" ON public.accounts FOR SELECT USING (auth.uid() = user_id);

-- Note: Add RLS policies in Supabase dashboard as needed for user-owned data
