const { logAudit } = require('../utils/audit');

// Audit middleware that records each admin request after response is sent
// Use only on /admin/* routes
function adminAudit() {
  return function (req, res, next) {
    const started = Date.now();
    const onFinish = async () => {
      res.removeListener('finish', onFinish);
      const durationMs = Date.now() - started;
      try {
        // req.user is expected to be populated by adminAuth inside route files
        const actorId = req.user ? req.user.sub : null;
        const actorEmail = req.user ? req.user.email : null;
        const meta = {
          method: req.method,
          path: req.originalUrl || req.url,
          status: res.statusCode,
          duration_ms: durationMs,
        };
        await logAudit({
          actor_id: actorId,
          actor_email: actorEmail,
          action: 'admin_request',
          target_type: 'http',
          target_id: null,
          changes: null,
          ip: req.ip,
          user_agent: req.get('user-agent') || null,
          metadata: meta,
        });
      } catch (e) {
        // avoid crashing middleware if audit fails
      }
    };

    res.on('finish', onFinish);
    return next();
  };
}

module.exports = adminAudit;
