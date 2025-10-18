// Simple logger that masks configured sensitive values before printing
const sensitiveKeys = [
  'JWT_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DB_PASSWORD',
];

function maskMessage(msg) {
  if (!msg || typeof msg !== 'string') return msg;
  let out = msg;
  for (const key of sensitiveKeys) {
    const val = process.env[key];
    if (val && typeof val === 'string' && val.length > 8) {
      out = out.split(val).join('[REDACTED]');
    }
  }
  return out;
}

function formatArgs(args) {
  return args.map((a) => {
    if (typeof a === 'string') return maskMessage(a);
    try {
      return JSON.stringify(a);
    } catch (e) {
      return a;
    }
  }).join(' ');
}

module.exports = {
  info: (...args) => console.log('[INFO]', formatArgs(args)),
  warn: (...args) => console.warn('[WARN]', formatArgs(args)),
  error: (...args) => console.error('[ERROR]', formatArgs(args)),
};
