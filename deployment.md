# Deployment

The production database is hosted by Neon PostgreSQL. The API is deployed as a regular Node.js service by the selected application host; Docker is not required and no Docker configuration is committed.

## Node.js service

Configure the application service with:

```text
Runtime: Node.js
Build command: npm ci
Start command: npm start
Health check path: /health
Node version: 20.19+ (22.12+ or 24+ also supported)
```

Do not commit provider credentials.

## Environment variables

Configure these values in the application host's secret settings:

- `DATABASE_URL`: the Neon pooled PostgreSQL connection string, including SSL parameters supplied by Neon. Never commit it.
- `JWT_SECRET`: a randomly generated secret of at least 32 bytes.
- `CLIENT_ORIGIN`: the exact HTTPS origin of the approved browser client.
- `TRUST_PROXY=true`: required when the container runs behind a trusted reverse proxy.
- `PORT`: supplied by the application host when required.

Keep the PostgreSQL database persistent and use provider-managed backups. Apply database schema changes through a reviewed SQL migration or the project’s configured migration process before serving traffic.

## Neon database setup

Create a Neon project and production branch, copy its pooled connection string into the application host's secret settings as `DATABASE_URL`, and keep the direct connection string private. Apply the committed migrations from a trusted environment:

```bash
npm ci
npm run db:migrate
```

The migration command is repeatable and does not run automatically when the API starts.

## Verification

After deployment, inspect sanitized runtime logs, then run:

```bash
curl -i https://YOUR_HOST/health
```

The expected response is:

```json
{"status":"ok","database":"up"}
```

After the health check succeeds, use disposable test data to verify registration, login, product creation, and order creation. Never use real passwords or production customer data for smoke tests.

If the health check returns `503`, verify that the Neon connection string is present, valid, and SSL-enabled. If the service fails to start, inspect sanitized logs and confirm that it binds to the configured `PORT`.
