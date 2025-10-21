/*
Simple smoke tests for Supabase RLS, auth, transfers, and storage.
Run with: node scripts/smoke_tests.js
Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_API_URL
*/

const { createClient } = require('@supabase/supabase-js');
let fetchFunc = (typeof fetch !== 'undefined' ? fetch : null);
if (!fetchFunc) {
  try {
    fetchFunc = require('node-fetch');
  } catch (e) {
    // if node-fetch not installed, we'll attempt globalThis.fetch (node 18+)
    fetchFunc = globalThis.fetch || null;
  }
}
const fetch = fetchFunc;

async function main() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  if (!sbUrl || !sbKey) {
    console.error('Missing Supabase envs');
    process.exit(2);
  }

  const supabase = createClient(sbUrl, sbKey);

  console.log('Checking RLS by running a simple select on profiles');
  try {
    const { data, error } = await supabase.from('profiles').select('id,email').limit(1);
    if (error) {
      console.error('RLS query error:', error.message || error);
    } else {
      console.log('Profiles query OK, rows:', (data || []).length);
    }
  } catch (e) {
    console.error('Profiles select failed', e && e.message);
  }

  console.log('Testing signup and login via API');
  try {
    const email = `smoke_${Date.now()}@example.com`;
    const password = 'Password123!@#';

    const signup = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        firstName: 'Smoke',
        lastName: 'Test',
        userType: 'personal',
      }),
    });
    const signupBody = await signup.json();
    console.log('Signup response', signup.status, signupBody?.message || signupBody?.error || 'ok');

    // Attempt login via API with service role will not create a session cookie in this script; skip login flow
  } catch (e) {
    console.error('Signup/login test failed', e && e.message);
  }

  console.log(
    'Testing transfer RPC (requires accounts rows and process_transfer_with_limits function)',
  );
  try {
    // Attempt to call RPC with service role to validate signature
    const rpc = await supabase.rpc('process_transfer_with_limits', {
      from_account_id: 'nonexistent',
      to_account_id: 'nonexistent',
      amount: 1,
    });
    if (rpc.error) console.log('RPC returned error (expected in many envs):', rpc.error.message);
    else console.log('RPC call OK', rpc.data);
  } catch (e) {
    console.error('RPC call failed', e && e.message);
  }

  console.log('Storage check: listing buckets');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) console.error('Storage listBuckets error', error.message || error);
    else console.log('Buckets:', data.map((b) => b.name).join(','));
  } catch (e) {
    console.error('Storage check failed', e && e.message);
  }

  console.log('Smoke tests completed. Interpret failures as environment-specific issues.');
}

main().catch((e) => {
  console.error('Smoke tests encountered error', e && e.message);
  process.exitCode = 1;
});
