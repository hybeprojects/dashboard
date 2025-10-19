const cron = require('node-cron');
const { run } = require('../scripts/backup_tables');
const logger = require('../utils/logger');

// Schedule daily at 2:05 AM to avoid collision with reconcile
cron.schedule('5 2 * * *', async () => {
  logger.info('Backup worker triggered at 02:05 AM');
  try {
    await run();
  } catch (e) {
    logger.error('Backup worker failed', e && (e.message || e));
  }
});

logger.info('Backup worker started, scheduled daily at 02:05 AM');
process.stdin.resume();
