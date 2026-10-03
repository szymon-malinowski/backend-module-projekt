# Customer, Product, and Order REST API

An individual Node.js/Express REST API backed by PostgreSQL and Prisma ORM 7. Current functionality includes Prisma migrations, a database-aware health check, shared request validation, and safe JSON error handling. Business endpoints remain planned in [API design](api-design.md); see the [project plan](project-plan.md) and [daily tasks](daily-todos.md).

## Local setup

Install Node.js 24 LTS (or a compatible version listed in `package.json`), npm, and PostgreSQL. Start PostgreSQL, then run from the project directory:

```powershell
npm ci
Copy-Item .env.example .env
createdb -h localhost -U postgres backend_module
```

If PostgreSQL commands are not on PATH, use their full paths, for example `& 'C:/Program Files/PostgreSQL/18/bin/createdb.exe' -h localhost -U postgres backend_module`.

Edit `.env`: set `DATABASE_URL` to your PostgreSQL connection string, `PORT` to the HTTP port (default 3000), and `CLIENT_ORIGIN` to the permitted browser origin. Example credentials are placeholders; URL-encode special characters in passwords. `.env` is ignored by Git.

For an empty database:

```powershell
npm run db:migrate
npm start
```

Use `npm run dev` for automatic restarts. Stop with Ctrl+C. Installation generates Prisma Client; run `npm run db:generate` again after schema changes. Generation does not connect to the database.

## Prisma models and migrations

`prisma/schema.prisma` defines Customer, Product, Order, and OrderItem. Camel-case client fields map to the existing SQL table and column names. Prices use Prisma Decimal, and foreign-key deletion rules match the original database. `src/db.js` creates Prisma Client with the PostgreSQL driver adapter and three-second connection/query timeouts.

`npm run db:migrate` runs `prisma migrate deploy`, applying committed migrations from `prisma/migrations` and tracking them in `_prisma_migrations`. Repeated runs skip completed migrations. The initial SQL migration wraps schema creation in a transaction and preserves all original CHECK constraints. Prisma schema syntax cannot represent these checks; preserve them in migration SQL when making future changes.

For future schema changes, edit `prisma/schema.prisma`, run `npm run db:migrate:dev -- --name descriptive_name` against a disposable development database, review the generated SQL, then run `npm run db:generate`. The development command may require permission to create a shadow database. Use `npm run db:validate` to validate the schema. Do not edit applied migrations or use `db push` as a replacement for committed migrations.

### Existing databases from the previous SQL runner

Do not run the initial migration over existing tables. Back up the database and verify that its four business tables and constraints match `prisma/migrations/001_initial/migration.sql` (the same schema as the legacy `database/schema.sql`). If they match, mark the initial Prisma migration as already applied:

```powershell
npx prisma migrate resolve --applied 001_initial
npm run db:migrate
npm run db:generate
```

This baseline records migration history without recreating tables or deleting records. The old `schema_migrations` table may remain as historical bookkeeping. If the schema differs, reconcile those differences before baselining; do not use a reset on data you need. Legacy SQL files under `database/` are references only; the custom migration runner has been removed. The application never runs migrations automatically. See [Prisma baselining](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining).

## Health check

```powershell
Invoke-RestMethod http://localhost:3000/health
```

`GET /health` executes a tagged Prisma `$queryRaw` query (`SELECT 1`). It returns HTTP 200 with `{"status":"ok","database":"up"}`, or HTTP 503 with `{"status":"unavailable","database":"down"}` if the query fails. Responses disable caching and omit internal details. This checks connectivity, not whether migrations have been applied. Missing `DATABASE_URL` prevents startup. Shutdown disconnects Prisma Client.

## Automated verification

```powershell
npm test
```

`npm run test:today` runs the same Jest suite. Jest uses Node's VM modules flag for this ESM project; Node may print an experimental-feature warning. HTTP tests cover health success/failure, unknown routes and methods, malformed/oversized JSON, body/params/query validation, optional and unknown fields, and safe synchronous/asynchronous errors. Business endpoints are still planned. The [API design and ERD](api-design.md) document their contracts and access rules.

To include real PostgreSQL verification, create a separate test database and set its connection string:

```powershell
createdb -h localhost -U postgres backend_module_test
$env:TEST_DATABASE_URL = 'postgres://postgres:YOUR_PASSWORD@localhost:5432/backend_module_test'
npm test
Remove-Item Env:TEST_DATABASE_URL
```

The integration check migrates a unique schema, verifies repeated deployment, Prisma model reads/writes, relations, decimal values, unique/check/foreign-key constraints, cascade deletion, transaction rollback, and a healthy response. A second integration check verifies that baselining the legacy schema preserves existing customer data. Each check removes only its generated schema afterward. Without `TEST_DATABASE_URL`, Jest explicitly skips both database integration tests; successful/failed health responses and missing configuration are still tested.
