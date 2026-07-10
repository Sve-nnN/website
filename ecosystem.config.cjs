// PM2 process config for the standalone Next/Payload server.
// CommonJS (.cjs) intentionally — this repo is "type": "module" in
// package.json, and PM2 reads .cjs config files more reliably than .js in
// ESM-flagged projects.
//
// Single fork-mode process, NOT cluster: multiple cluster workers would
// multiply the Postgres connection pool uncontrollably (see
// scripts/verify-db-pool.ts and NEON-POOL-SIZING.md in Plan 06-02).
module.exports = {
  apps: [
    {
      name: 'juan-payload',
      script: '.next/standalone/server.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      // max_memory_restart: '512M', // TODO(Juan): set this based on the real
      // RAM of the confirmed Hostinger tier (see Task 2 of the runbook in
      // this plan). Left commented until the tier is confirmed.
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
    },
  ],
}
