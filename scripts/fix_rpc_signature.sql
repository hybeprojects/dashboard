-- Wrapper overload to support legacy RPC signature used by smoke tests
-- Original smoke tests expect: process_transfer_with_limits(amount, from_account_id, to_account_id)

CREATE OR REPLACE FUNCTION public.process_transfer_with_limits(
  p_amount numeric,
  p_from_account_id uuid,
  p_to_account_id uuid
) RETURNS uuid
LANGUAGE sql
AS $$
  SELECT public.process_transfer_with_limits(p_from_account_id, p_to_account_id, p_amount, 'USD', NULL);
$$;

-- Also create a wrapper that accepts named params without p_ prefix if needed
CREATE OR REPLACE FUNCTION public.process_transfer_with_limits(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric
) RETURNS uuid
LANGUAGE sql
AS $$
  SELECT public.process_transfer_with_limits(p_from_account_id, p_to_account_id, p_amount, 'USD', NULL);
$$;
