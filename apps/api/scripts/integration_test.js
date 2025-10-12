(async () => {
  // simple integration tester for local API
  const base = process.env.API_BASE || 'http://localhost:4000';
  const endpoints = [
    { method: 'GET', path: '/accounts' },
    { method: 'GET', path: '/auth/link-status?email=test%40example.com' },
    { method: 'GET', path: '/' },
  ];

  // simple fetch wrapper with fallback to node-fetch
  let _fetch = global.fetch;
  if (!_fetch) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      _fetch = require('node-fetch');
    } catch (e) {
      console.error('fetch not available and node-fetch not installed');
      process.exit(2);
    }
  }

  async function doReq(e, token) {
    const url = `${base}${e.path}`;
    const options = {
      method: e.method,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (e.body) {
      options.body = JSON.stringify(e.body);
    }

    try {
      const res = await _fetch(url, options);
      const ct = res.headers.get ? res.headers.get('content-type') : '';
      let body;
      try {
        if (ct && ct.includes('application/json')) body = await res.json();
        else body = await res.text();
      } catch (err) {
        body = `<failed to parse body: ${err.message}>`;
      }
      console.log(`\n[${e.method}] ${url} -> ${res.status} ${res.statusText}`);
      console.log('Body:', typeof body === 'string' ? body.slice(0, 1000) : JSON.stringify(body, null, 2));
      return { status: res.status, body };
    } catch (err) {
      console.error(`\n[${e.method}] ${url} -> ERROR:`, err.message || err);
      return { status: 500, body: null };
    }
  }

  console.log('Running integration tests against', base);
  for (const e of endpoints) {
    // eslint-disable-next-line no-await-in-loop
    await doReq(e);
  }

  // Test registration and KYC submission
  try {
    const registerPayload = {
      method: 'POST',
      path: '/auth/register',
      body: {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const { status: regStatus, body: regBody } = await doReq(registerPayload);
    if (regStatus === 201 && regBody.accessToken) {
      console.log('✅ Registration test passed');
      const kycPayload = {
        method: 'POST',
        path: '/kyc/submit',
        body: {
          accountType: 'personal',
          fullName: 'Test User',
          dob: '1990-01-01',
          ssn: '000-00-0000',
          address: '123 Main St',
        },
      };
      const { status: kycStatus, body: kycBody } = await doReq(kycPayload, regBody.accessToken);
      if (kycStatus === 201 && kycBody.status === 'submitted') {
        console.log('✅ KYC submission test passed');
      } else {
        console.error('❌ KYC submission test failed');
      }
    } else {
      console.error('❌ Registration test failed');
    }
  } catch (err) {
    console.error('Error running integration tests:', err);
  }

  console.log('\nIntegration tests complete');
})();
