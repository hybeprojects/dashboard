const assert = require('assert');

const API_BASE = 'http://localhost:5000';

async function runTest() {
  const { default: fetch } = await import('node-fetch');
  // 1. Create a user and get a token
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123';
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

  // 2. Get user's account info
  // This is a bit tricky since the /me endpoint doesn't return accountId.
  // We'll have to read the users.json file to get the accountId.
  // This is not ideal, but for this test it will work.
  const fs = require('fs-extra');
  const path = require('path');
  const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
  const users = await fs.readJson(USERS_FILE);
  const user = users.find((u) => u.email === email);
  assert(user, 'Could not find test user in users.json');

  // Manually set accountId for testing purposes since Fineract is not available.
  if (!user.accountId) {
    user.accountId = 12345; // A dummy account id
    await fs.writeJson(USERS_FILE, users, { spaces: 2 });
  }

  assert(user.accountId, 'Test user does not have an accountId');

  const fromAccountId = user.accountId;
  const toAccountId = user.accountId; // Transfer to self

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
