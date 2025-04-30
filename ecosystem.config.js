module.exports = {
  apps: [
    {
      name: 'fuel-server',
      cwd: './server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '0.0.0.0'
      },
      exp_backoff_restart_delay: 100,
      restart_delay: 5000
    }
  ]
}; 