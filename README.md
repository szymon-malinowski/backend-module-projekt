# Customer, Product, and Order REST API

An individual Node.js/Express REST API backed by PostgreSQL. Current functionality includes database migrations and a database-aware health check. Business endpoints are planned in [API design](api-design.md); see the [project plan](project-plan.md) and [daily tasks](daily-todos.md).

## Local setup

Install Node.js (with npm) and PostgreSQL, and start PostgreSQL. From the project directory:

```powershell
npm ci
Copy-Item .env.example .env
```

Create an empty database using your PostgreSQL account (enter its password when prompted):

```powershell
createdb -h localhost -U postgres backend_module
```

If PostgreSQL commands are not on PATH, use their full paths, for example `& 'C:/Program Files/PostgreSQL/18/bin/createdb.exe' -h localhost -U postgres backend_module`.

Edit `.env`: set `DATABASE_URL` to your database connection string, `PORT` to the HTTP port (default 3000), and `CLIENT_ORIGIN` to the permitted browser origin. The example credentials are placeholders; URL-encode special characters in passwords. `.env` is ignored by Git.

```powershell
npm run db:migrate
npm start
```

Use `npm run dev` for automatic restarts during development. Stop with Ctrl+C.

## Migrations

`npm run db:migrate` applies numbered SQL files from `database/migrations` in filename order and records them in `schema_migrations`. A transaction and advisory lock prevent partial application and competing migration runs. Re-running the command skips recorded migrations. Add a new numbered migration for later changes; do not edit already applied migrations.

`database/schema.sql` is the original schema reference. Do not run it separately before migrations. If it was already applied to a development database, use a new empty database for this migration workflow rather than deleting existing data. The application does not run migrations automatically.

## Health check

```powershell
Invoke-RestMethod http://localhost:3000/health
```

`GET /health` runs `SELECT 1` against PostgreSQL. It returns HTTP 200 with `{"status":"ok","database":"up"}`, or HTTP 503 with `{"status":"unavailable","database":"down"}` if the database query fails. Responses disable caching and omit internal error details. This checks connectivity, not whether migrations have been applied. Missing `DATABASE_URL` prevents startup; connection/query timeouts are three seconds each.

## Verification for 2 October

```powershell
npm run test:today
```

To include real PostgreSQL verification, create a separate test database and set its connection string for the command:

```powershell
createdb -h localhost -U postgres backend_module_test
$env:TEST_DATABASE_URL = 'postgres://postgres:YOUR_PASSWORD@localhost:5432/backend_module_test'
npm run test:today
Remove-Item Env:TEST_DATABASE_URL
```

The integration check creates a unique schema and removes only that schema afterward. It verifies first and repeated migrations, table creation, constraints, failed-migration rollback, and healthy responses. Without `TEST_DATABASE_URL`, it is explicitly skipped; database-failure responses and missing configuration are still tested. Today's checks use Node's built-in test runner; the planned Jest setup remains a later task.
