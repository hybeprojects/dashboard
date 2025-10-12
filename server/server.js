const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok' });
});

app.get('/api/accounts', (req, res) => {
  // Minimal example endpoint for the dashboard to call
  return res.json({ accounts: [] });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dashboard server listening on http://localhost:${PORT}`);
});
