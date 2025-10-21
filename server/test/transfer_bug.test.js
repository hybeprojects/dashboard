const assert = require('assert');

const API_BASE = 'http://localhost:5000';

async function runTest() {
  const { default: fetch } = await import('node-fetch');
  // 1. Create a user and get a token
  const email = `testuser_${Date.now()}@example.com`;
  const password = process.env.SEED_ADMIN_PASSWORD || 'password123';
  let signupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName: 'Test', lastName: 'User' }),
  });

  if (signupRes.status !== 200) {
    console.error('Signup failed', await signupRes.text());
    process.exit(1);
  }

  const { accessToken } = await signupRes.json();
  assert(accessToken, 'Did not receive access token');

  // 2. Get user's account info from Supabase app_users
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const { data: appUserRows, error: appErr } = await sb
    .from('app_users')
    .select('*')
    .eq('email', email)
    .limit(1)
    .maybeSingle();
  if (appErr) {
    console.error('Failed to query app_users', appErr);
    process.exit(1);
  }
  let user = appUserRows || null;
  // If app_users entry not present, create a fallback mapping with dummy account
  if (!user) {
    const newUser = { id: (await import('uuid')).v4(), email, first_name: 'Test' };
    const { data: ins, error: insErr } = await sb
      .from('app_users')
      .insert(newUser)
      .select()
      .maybeSingle();
    if (insErr) console.warn('Failed to insert app_user', insErr);
    user = ins || newUser;
  }

  // Manually set accountId for testing purposes since Fineract is not available.
  if (!user.account_id) {
    const dummyAccount = 12345;
    await sb
      .from('app_users')
      .update({ account_id: dummyAccount })
      .eq('id', user.id)
      .catch(() => {});
    user.account_id = dummyAccount;
  }

  const fromAccountId = user.account_id;
  const toAccountId = user.account_id; // Transfer to self

  // 3. Attempt to make a transfer to the same account
  console.log(`Attempting to transfer to self for account ${fromAccountId}`);
  const transferRes = await fetch(`${API_BASE}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fromAccountId,
      toAccountId,
      amount: 10,
      memo: 'test self-transfer',
    }),
  });

  // 4. Assert that the request fails with a 400 error
  console.log(`Received status: ${transferRes.status}`);
  assert.strictEqual(transferRes.status, 400, 'Expected status code 400 for self-transfer');
  const body = await transferRes.json();
  console.log('Received body:', body);
  assert.strictEqual(
    body.error,
    'sender and receiver accounts cannot be the same',
    'Expected specific error message',
  );

  console.log('Test passed: Server correctly rejected self-transfer.');
}

// Need to start the server for this test to run.
// I will run the server in the background and then run this test.
runTest().catch((err) => {
  console.error('Test failed', err);
  process.exit(1);
});
