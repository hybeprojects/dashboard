-- RLS and storage policies for premium-banking
-- Run this in Supabase SQL editor

-------------------------------
-- accounts: users see only their accounts
-------------------------------
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;

-- Allow owners to SELECT their accounts
CREATE POLICY IF NOT EXISTS accounts_select_owner ON public.accounts
  FOR SELECT USING (owner_id = auth.uid());

-- Allow inserting accounts where owner_id is the current user
CREATE POLICY IF NOT EXISTS accounts_insert_owner ON public.accounts
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Allow users to update non-balance fields on their account
CREATE POLICY IF NOT EXISTS accounts_update_owner ON public.accounts
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND balance = public.accounts.balance);

-- Deny deleting accounts (admins must use service role via Edge Function)
CREATE POLICY IF NOT EXISTS accounts_no_delete ON public.accounts
  FOR DELETE USING (false);

-------------------------------
-- transfers: users create and can see their transfers
-------------------------------
ALTER TABLE IF EXISTS public.transfers ENABLE ROW LEVEL SECURITY;

-- Allow users to INSERT transfers when acting as actor and the from_account belongs to them
CREATE POLICY IF NOT EXISTS transfers_insert_auth ON public.transfers
  FOR INSERT WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = from_account_id AND a.owner_id = auth.uid())
  );

-- Allow users to SELECT transfers where they are involved
CREATE POLICY IF NOT EXISTS transfers_select_involved ON public.transfers
  FOR SELECT USING (
    actor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = public.transfers.from_account_id AND a.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = public.transfers.to_account_id AND a.owner_id = auth.uid())
  );

-- Prevent direct updates to completed transfers by users
CREATE POLICY IF NOT EXISTS transfers_update_none ON public.transfers
  FOR UPDATE USING (false);

-------------------------------
-- kyc_submissions (kyc_documents): users see own, admins see all
-------------------------------
ALTER TABLE IF EXISTS public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Allow users to INSERT submissions for themselves
CREATE POLICY IF NOT EXISTS kyc_insert_owner ON public.kyc_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to SELECT their submissions
CREATE POLICY IF NOT EXISTS kyc_select_owner ON public.kyc_submissions
  FOR SELECT USING (user_id = auth.uid());

-- Allow users to UPDATE their own submissions except status/review fields
CREATE POLICY IF NOT EXISTS kyc_update_owner ON public.kyc_submissions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (status = public.kyc_submissions.status) -- disallow changing status via user update
  );

-- Allow admins (profiles.is_admin) to SELECT and UPDATE all submissions
CREATE POLICY IF NOT EXISTS kyc_admin_select_update ON public.kyc_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-------------------------------
-- profiles: users manage own profile
-------------------------------
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS profiles_select_self ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Allow users to INSERT their profile record when signing up
CREATE POLICY IF NOT EXISTS profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-------------------------------
-- Storage: storage.objects policies for kyc-documents bucket
-- Requires RLS on storage.objects (schema: storage)
-------------------------------
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload to kyc-documents with constraints (size, content_type, owner)
CREATE POLICY IF NOT EXISTS storage_kyc_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents'
    AND owner = auth.uid()
    AND size <= 5242880 -- 5MB
    AND content_type IN ('image/jpeg', 'image/png', 'application/pdf')
  );

-- Allow owners to SELECT their objects in the kyc-documents bucket
CREATE POLICY IF NOT EXISTS storage_kyc_select_owner ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND owner = auth.uid()
  );

-- Allow admins to SELECT/DELETE any object in the kyc-documents bucket
CREATE POLICY IF NOT EXISTS storage_kyc_admin ON storage.objects
  FOR ALL USING (
    bucket_id = 'kyc-documents' AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Allow owners to DELETE their objects
CREATE POLICY IF NOT EXISTS storage_kyc_delete_owner ON storage.objects
  FOR DELETE USING (bucket_id = 'kyc-documents' AND owner = auth.uid());

-- Prevent unauthenticated access to this bucket
CREATE POLICY IF NOT EXISTS storage_kyc_no_anon ON storage.objects
  FOR SELECT USING (false);

-------------------------------
-- Notes:
-- 1) Admin operations that require bypassing RLS should be done via Edge Functions using the service role key.
-- 2) After applying policies, test with non-admin and admin users.
-- 3) Adjust column names (owner_id vs owner) if your schema differs.
