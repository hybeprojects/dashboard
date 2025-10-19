const cron = require('node-cron');
const { run } = require('../scripts/reconcile_balances');
const logger = require('../utils/logger');

// Schedule daily at 2:00 AM server local time
cron.schedule('0 2 * * *', async () => {
  logger.info('Reconcile worker triggered at 2:00 AM');
  try {
    await run();
  } catch (e) {
    logger.error('Reconcile worker failed', e && (e.message || e));
  }
});

// Keep the process running
logger.info('Reconcile worker started, scheduled daily at 2:00 AM');
process.stdin.resume();
