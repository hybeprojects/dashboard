-- Policies and RLS

-- Ensure transactions has user_id
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id uuid;

-- populate transactions.user_id from accounts
UPDATE public.transactions SET user_id = (SELECT user_id FROM public.accounts WHERE public.accounts.id = public.transactions.account_id) WHERE user_id IS NULL;

-- Enable row level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- users: allow users to select/update their own row
CREATE POLICY users_select ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY users_insert ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- accounts: allow access only to owner
CREATE POLICY accounts_select ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY accounts_insert ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY accounts_update ON public.accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY accounts_delete ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- transactions: allow access if account belongs to user
CREATE POLICY transactions_select ON public.transactions FOR SELECT USING ((SELECT user_id FROM public.accounts WHERE public.accounts.id = public.transactions.account_id) = auth.uid());
CREATE POLICY transactions_insert ON public.transactions FOR INSERT WITH CHECK ((SELECT user_id FROM public.accounts WHERE public.accounts.id = public.transactions.account_id) = auth.uid());
CREATE POLICY transactions_update ON public.transactions FOR UPDATE USING ((SELECT user_id FROM public.accounts WHERE public.accounts.id = public.transactions.account_id) = auth.uid()) WITH CHECK ((SELECT user_id FROM public.accounts WHERE public.accounts.id = public.transactions.account_id) = auth.uid());

-- notifications: owner only
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_insert ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- refresh_tokens: only service role should access; allow authenticated server role via policy that rejects public (we'll restrict selects)
-- For safety, deny RLS to all non-service roles; here we create a policy that allows nothing for anon; the service role (using service key) bypasses RLS.
CREATE POLICY refresh_tokens_no_public ON public.refresh_tokens FOR SELECT USING (auth.role() = 'service_role');

-- Note: Adjust policies in Supabase dashboard if your auth.uid() differs from users.id
