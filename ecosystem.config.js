module.exports = {
  apps: [
    {
      name: 'fineract-sync-worker',
      script: './scripts/sync_worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // container-friendly logging
      log_file: '/proc/1/fd/1',
      out_file: '/proc/1/fd/1',
      error_file: '/proc/1/fd/2',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'fineract-realtime-trigger',
      script: './scripts/realtime_trigger.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      // container-friendly logging
      log_file: '/proc/1/fd/1',
      out_file: '/proc/1/fd/1',
      error_file: '/proc/1/fd/2',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
