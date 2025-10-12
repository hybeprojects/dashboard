(async () => {
  // simple integration tester for local API
  const base = process.env.API_BASE || 'http://localhost:4000';
  const endpoints = [
    { method: 'GET', path: '/accounts' },
    { method: 'GET', path: '/auth/link-status?email=test%40example.com' },
    { method: 'GET', path: '/' },
    {
      method: 'POST',
      path: '/transactions/deposit',
      body: { accountId: 'a4f22c5a-5a30-4e4b-8a8a-8a8a8a8a8a8a', amount: -100 },
    },
    {
      method: 'POST',
      path: '/transactions/withdraw',
      body: { accountId: 'a4f22c5a-5a30-4e4b-8a8a-8a8a8a8a8a8a', amount: -100 },
    },
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

  async function doReq(e) {
    const url = `${base}${e.path}`;
    const options = {
      method: e.method,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    };
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
    } catch (err) {
      console.error(`\n[${e.method}] ${url} -> ERROR:`, err.message || err);
    }
  }

  console.log('Running integration tests against', base);
  for (const e of endpoints) {
    // eslint-disable-next-line no-await-in-loop
    await doReq(e);
  }
  console.log('\nIntegration tests complete');
})();
