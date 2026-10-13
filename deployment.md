# Deployment

Run the API as a Node.js 24 service on a platform that supplies a managed PostgreSQL database and terminates HTTPS at its reverse proxy or load balancer. The release command runs committed Prisma migrations before the application starts; do not use `prisma db push` in production.

Configure these runtime secrets and values in the provider dashboard:

- `DATABASE_URL`: the managed PostgreSQL connection string, including TLS options required by the provider.
- `JWT_SECRET`: a randomly generated value with at least 32 bytes.
- `CLIENT_ORIGIN`: the exact HTTPS origin of the approved browser client.
- `PORT`: the provider-assigned port, if it differs from 3000.
- `TRUST_PROXY=true`: required when the provider places the app behind a trusted reverse proxy, so rate limiting sees the client IP.

Configure the service with these commands:

```text
Install/build: npm ci
Release/migration: npm run db:migrate
Start: npm start
```

The provider must expose `GET /health` as its health check and route only HTTPS traffic to the container. Verify the deployment in this order:

```powershell
Invoke-RestMethod https://YOUR_HOST/health
```

Then register a disposable customer, log in, create a product with a staff account, and create an order. Never use real passwords or commit provider credentials. Keep the PostgreSQL database persistent and take provider-managed backups before migration changes. If a migration fails, stop the rollout, inspect sanitized logs, restore the database if necessary, and deploy the previous image; migrations are forward-only and applied before the new process accepts traffic.

No provider was selected in this project, so a live URL cannot be recorded yet. The Node.js service commands, environment contract, migration command, HTTPS requirement, health check, and recovery procedure are ready for the chosen hosting provider. Docker is not required or used.
