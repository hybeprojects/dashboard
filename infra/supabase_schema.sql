-- Run these statements in Supabase SQL editor or via migrations
-- Enum types for consistency
CREATE TYPE kyc_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE transaction_type_enum AS ENUM ('deposit', 'withdrawal', 'transfer');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'failed');

-- users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text UNIQUE NOT NULL,
  password_hash text,
  kyc_status kyc_status_enum DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  account_number text UNIQUE NOT NULL,
  balance numeric(15, 2) DEFAULT 0,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON public.accounts(user_id);

-- transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  type transaction_type_enum NOT NULL,
  amount numeric(15, 2) NOT NULL,
  recipient_account_id uuid REFERENCES public.accounts(id),
  status transaction_status_enum DEFAULT 'pending',
  timestamp timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_account_id_idx ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_recipient_account_id_idx ON public.transactions(recipient_account_id);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ip_address text,
  timestamp timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);

-- refresh tokens
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON public.refresh_tokens(user_id);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_owner" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_owner_insert" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_owner_update" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_transactions" ON public.transactions FOR SELECT USING (
  account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()) OR
  recipient_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);
CREATE POLICY "users_transactions_insert" ON public.transactions FOR INSERT WITH CHECK (
  account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);

CREATE POLICY "users_notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Note: Further policies might be needed depending on application logic
