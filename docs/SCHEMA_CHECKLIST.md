Supabase schema checklist

Run these checks against your Supabase Postgres to ensure compatibility with the app DTOs.

1. transactions RPC (transfer_funds signature)

Check function exists and parameters:

SELECT proname, proargnames, proargtypes::regtype[] FROM pg_proc WHERE proname = 'transfer_funds';

-- Example expected signature: transfer_funds(from_id uuid, to_account_number text, amount numeric)

2. accounts table: balance type

-- Ensure accounts.balance is numeric/decimal
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='accounts' AND column_name='balance';

-- Expect data_type = numeric or double precision

3. notifications table: is_read vs read

-- Ensure column used by backend is present; backend expects 'is_read' boolean
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='notifications' AND column_name IN ('is_read','read');

4. KYC storage bucket

-- Ensure Supabase storage bucket 'kyc-docs' exists and public URL works.
-- Using Supabase CLI (or JS):
-- supabase storage list
-- supabase storage create kyc-docs --public

-- Test public URL access pattern:
-- https://<your-supabase>.supabase.co/storage/v1/object/public/kyc-docs/<path>

5. Additional checks

-- audit_logs, refresh_tokens, accounts, transactions tables should exist with expected columns.

-- Example: check refresh_tokens
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='refresh_tokens';

If something is missing, apply the migrations or run the SQL in apps/api/scripts directory (if present) or contact your DB admin.
