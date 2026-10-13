# Deployment

Deploy the API to Render as a Node.js service with Render PostgreSQL. Connect Render to this GitHub repository and deploy the reviewed `main` branch after GitHub Actions passes. The root `render.yaml` Blueprint defines the web service, database, migration command, start command, and `/health` check. The release command runs committed Prisma migrations before the application starts; do not use `prisma db push` in production.

Configure these runtime secrets and values in the provider dashboard:

- `DATABASE_URL`: the managed PostgreSQL connection string, including TLS options required by the provider.
- `JWT_SECRET`: a randomly generated value with at least 32 bytes.
- `CLIENT_ORIGIN`: the exact HTTPS origin of the approved browser client.
- `PORT`: the provider-assigned port, if it differs from 3000.
- `TRUST_PROXY=true`: required when the provider places the app behind a trusted reverse proxy, so rate limiting sees the client IP.

The Render service uses these commands:

```text
Install/build: npm ci
Release/migration: npm run db:migrate
Start: npm start
```

Render must expose `GET /health` as its health check and route only HTTPS traffic to the service. Verify the deployment in this order:

```powershell
Invoke-RestMethod https://YOUR_HOST/health
```

Then register a disposable customer, log in, create a product with a staff account, and create an order. Never use real passwords or commit provider credentials. Keep the PostgreSQL database persistent and take provider-managed backups before migration changes. If a migration fails, stop the rollout, inspect sanitized logs, restore the database if necessary, and deploy the previous image; migrations are forward-only and applied before the new process accepts traffic.

Render is selected as the deployment target, but no connected Render account or service URL is available in this workspace, so a live URL cannot be recorded yet. GitHub supplies source control and CI; Render runs the API and database. Docker is not required or used.
