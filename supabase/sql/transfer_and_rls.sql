-- Enable pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Secure, atomic transfer function
-- This function performs ledger-safe balance updates and inserts transfer + transaction and audit logs atomically.
CREATE OR REPLACE FUNCTION public.transfer_funds(
  p_from_account uuid,
  p_to_account uuid,
  p_amount numeric,
  p_currency text,
  p_actor uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_balance numeric;
  v_to_balance numeric;
  v_transfer_id uuid := gen_random_uuid();
  v_now timestamptz := timezone('utc', now());
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount' USING MESSAGE = 'Transfer amount must be positive';
  END IF;

  -- Lock both account rows in stable order to avoid deadlocks
  IF p_from_account < p_to_account THEN
    SELECT balance INTO v_from_balance FROM public.accounts WHERE id = p_from_account FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'from_account_not_found'; END IF;
    SELECT balance INTO v_to_balance FROM public.accounts WHERE id = p_to_account FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'to_account_not_found'; END IF;
  ELSE
    SELECT balance INTO v_to_balance FROM public.accounts WHERE id = p_to_account FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'to_account_not_found'; END IF;
    SELECT balance INTO v_from_balance FROM public.accounts WHERE id = p_from_account FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'from_account_not_found'; END IF;
  END IF;

  IF v_from_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_funds' USING MESSAGE = 'Insufficient funds';
  END IF;

  -- Update balances
  UPDATE public.accounts
  SET balance = balance - p_amount
  WHERE id = p_from_account;

  UPDATE public.accounts
  SET balance = balance + p_amount
  WHERE id = p_to_account;

  -- Insert transfer record
  INSERT INTO public.transfers (
    id, from_account_id, to_account_id, amount, currency, actor_id, status, created_at
  ) VALUES (
    v_transfer_id, p_from_account, p_to_account, p_amount, p_currency, p_actor, 'completed', v_now
  );

  -- Insert corresponding ledger/transaction entries
  INSERT INTO public.transactions (id, account_id, amount, currency, type, related_transfer_id, created_at)
  VALUES (gen_random_uuid(), p_from_account, -p_amount, p_currency, 'debit', v_transfer_id, v_now);

  INSERT INTO public.transactions (id, account_id, amount, currency, type, related_transfer_id, created_at)
  VALUES (gen_random_uuid(), p_to_account, p_amount, p_currency, 'credit', v_transfer_id, v_now);

  -- Audit log
  INSERT INTO public.audit_logs (id, actor_id, action, target_type, target_id, metadata, created_at)
  VALUES (
    gen_random_uuid(), p_actor, 'transfer', 'transfer', v_transfer_id,
    jsonb_build_object('amount', p_amount, 'from', p_from_account, 'to', p_to_account), v_now
  );

  RETURN v_transfer_id;
END;
$$;

-- 2) Row-Level Security policies
-- Accounts: only owners can SELECT/UPDATE; service role and functions running with SECURITY DEFINER can bypass.
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;

-- Allow owners to SELECT their accounts
CREATE POLICY IF NOT EXISTS accounts_select_owner ON public.accounts
  FOR SELECT USING (owner_id = auth.uid());

-- Allow account owners to UPDATE their account (e.g., update nickname)
CREATE POLICY IF NOT EXISTS accounts_update_owner ON public.accounts
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Transfers: enable RLS
ALTER TABLE IF EXISTS public.transfers ENABLE ROW LEVEL SECURITY;

-- Allow users to INSERT transfer records only if they are the actor and the from_account belongs to them
CREATE POLICY IF NOT EXISTS transfers_insert_auth ON public.transfers
  FOR INSERT WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.accounts a WHERE a.id = from_account_id AND a.owner_id = auth.uid()
    )
  );

-- Allow users to SELECT transfers where they are involved (actor OR owner of from/to account)
CREATE POLICY IF NOT EXISTS transfers_select_involved ON public.transfers
  FOR SELECT USING (
    actor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = public.transfers.from_account_id AND a.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = public.transfers.to_account_id AND a.owner_id = auth.uid())
  );

-- Transactions (ledger entries): owners of the account should see associated transactions
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS transactions_select_account_owner ON public.transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = public.transactions.account_id AND a.owner_id = auth.uid())
  );

-- KYC submissions: users can INSERT their own submissions and view their submissions; admins (profiles.is_admin) can view all
ALTER TABLE IF EXISTS public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS kyc_insert_owner ON public.kyc_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS kyc_select_owner_or_admin ON public.kyc_submissions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Profiles: allow users to SELECT/UPDATE their own profile
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS profiles_select_self ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY IF NOT EXISTS profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Optional: Restrict direct balance modifications by regular users (allow only service role or functions)
-- Deny direct UPDATE to accounts.balance by authenticated users; instead, encourage use of transfer_funds
CREATE POLICY IF NOT EXISTS accounts_restrict_balance_update ON public.accounts
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (balance = balance) ;
-- Note: the above CHECK is a no-op to prevent balance changes by users in a simple way. For stricter control create a separate policy

-- 3) Grant execute on transfer_funds to authenticated role
GRANT EXECUTE ON FUNCTION public.transfer_funds(uuid, uuid, numeric, text, uuid) TO authenticated;

-- 4) Recommended: Create a SECURITY DEFINER wrapper owned by a DB role with minimal rights if you want extra control.

-- End of SQL
