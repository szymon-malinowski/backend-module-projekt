# Deployment

Deploy the REST API as a Docker container with PostgreSQL. Build the image from the repository root and run it in a Docker-compatible hosting environment. The repository contains the production `Dockerfile`.

## Docker service

Configure the Docker-compatible service with:

```text
Runtime: Docker
Dockerfile path: ./Dockerfile
Docker context: .
Start command: defined by the Dockerfile
Health check path: /health
```

The Docker image installs production dependencies and starts the API with:

```text
npm start
```

Do not use a Node.js runtime configuration or commit provider credentials.

## Environment variables

Configure these values in the container host’s environment settings:

- `DATABASE_URL`: the connection URL for the persistent PostgreSQL database. Never use `localhost` or `127.0.0.1` when the database runs outside the container.
- `JWT_SECRET`: a randomly generated secret of at least 32 bytes.
- `CLIENT_ORIGIN`: the exact HTTPS origin of the approved browser client.
- `TRUST_PROXY=true`: required when the container runs behind a trusted reverse proxy.
- `PORT`: the port exposed and mapped by the container host.

Keep the PostgreSQL database persistent and use provider-managed backups. Apply database schema changes through a reviewed SQL migration or the project’s configured migration process before serving traffic.

## Verification

After deployment, inspect the Docker build and runtime logs, then run:

```bash
curl -i https://YOUR_HOST/health
```

The expected response is:

```json
{"status":"ok","database":"up"}
```

After the health check succeeds, use disposable test data to verify registration, login, product creation, and order creation. Never use real passwords or production customer data for smoke tests.

If the health check returns `503`, verify that PostgreSQL is running and that `DATABASE_URL` is correct. If the container fails to start, inspect sanitized logs and confirm that the service binds to the configured `PORT`.
