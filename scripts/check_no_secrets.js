// Simple pre-commit scan for obvious secrets or weak defaults.
// Exit with non-zero when suspicious patterns found.

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const IGNORES = ['.git', 'node_modules', 'dist', '.next', 'coverage'];
const patterns = [
  { re: /rootpassword/i, reason: 'Weak or default MySQL root password' },
  { re: /password123/i, reason: 'Weak default password found' },
  { re: /MYSQL_ROOT_PASSWORD\s*[:=]/i, reason: 'MYSQL_ROOT_PASSWORD set in repo' },
  { re: /MYSQL_PASSWORD\s*[:=]/i, reason: 'MYSQL_PASSWORD set in repo' },
  { re: /BEGIN RSA PRIVATE KEY/, reason: 'Private key block present' },
  {
    re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"]?\w+['\"]?/i,
    reason: 'Possible service role key committed',
  },
  {
    re: /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*['\"]?\w+['\"]?/i,
    reason: 'Public anon key present in code',
  },
];

let findings = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORES.includes(e.name)) continue;
    const p = path.join(dir, e.name);
    try {
      if (e.isDirectory()) {
        walk(p);
        continue;
      }
      if (!e.isFile()) continue;
      const ext = path.extname(e.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.bmp', '.zip', '.exe'].includes(ext)) continue;
      const txt = fs.readFileSync(p, 'utf8');
      for (const pat of patterns) {
        if (pat.re.test(txt)) {
          findings.push({ file: p.replace(root + path.sep, ''), reason: pat.reason });
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

walk(root);

if (findings.length) {
  console.error('Secret scan found potential issues:');
  for (const f of findings) console.error('-', f.file, ':', f.reason);
  process.exit(2);
}

console.log('Secret scan: no obvious issues found.');
