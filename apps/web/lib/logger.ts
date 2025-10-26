const sensitiveKeys = ['JWT_SECRET', 'DB_PASSWORD'];

function maskMessage(msg: string) {
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

function formatArgs(args: any[]) {
  return args
    .map((a) => {
      if (typeof a === 'string') return maskMessage(a);
      try {
        return JSON.stringify(a);
      } catch (e) {
        return String(a);
      }
    })
    .join(' ');
}

export const logger = {
  info: (...args: any[]) => console.log('[INFO]', formatArgs(args)),
  warn: (...args: any[]) => console.warn('[WARN]', formatArgs(args)),
  error: (...args: any[]) => console.error('[ERROR]', formatArgs(args)),
};
