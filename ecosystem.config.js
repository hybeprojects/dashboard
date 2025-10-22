module.exports = {
  apps: [
    {
      name: 'fineract-sync-worker',
      script: './scripts/sync_worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'fineract-realtime-trigger',
      script: './scripts/realtime_trigger.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
