module.exports = {
  apps: [
    {
      name: 'dashboard-server',
      script: 'server/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
    },
    {
      name: 'reconcile-worker',
      script: 'server/jobs/reconcile_worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
    },
    {
      name: 'backup-worker',
      script: 'server/jobs/backup_worker.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
    },
  ],
};
