# Customer, Product, and Order REST API

An individual Node.js/Express REST API backed by PostgreSQL and Prisma ORM 7. Current functionality includes Prisma migrations, a database-aware health check, shared request validation, safe JSON error handling, authentication, customer CRUD with ownership and staff permissions, and product CRUD with price, stock, and order-reference protections. Order endpoints remain planned in [API design](api-design.md); see the [project plan](project-plan.md) and [daily tasks](daily-todos.md).

## Local setup

Install Node.js 24 LTS (or a compatible version listed in `package.json`), npm, and PostgreSQL. Start PostgreSQL, then run from the project directory:

```powershell
npm ci
Copy-Item .env.example .env
createdb -h localhost -U postgres backend_module
```

If PostgreSQL commands are not on PATH, use their full paths, for example `& 'C:/Program Files/PostgreSQL/18/bin/createdb.exe' -h localhost -U postgres backend_module`.

Edit `.env`: set `DATABASE_URL` to your PostgreSQL connection string, `PORT` to the HTTP port (default 3000), `CLIENT_ORIGIN` to the permitted browser origin, and `JWT_SECRET` to a random secret of at least 32 bytes (see Authentication below). Example credentials are placeholders; URL-encode special characters in passwords. `.env` is ignored by Git.

For an empty database:

```powershell
npm run db:migrate
npm start
```

Use `npm run dev` for automatic restarts. Stop with Ctrl+C. Installation generates Prisma Client; run `npm run db:generate` again after schema changes. Generation does not connect to the database.

## Prisma models and migrations

`prisma/schema.prisma` defines Customer, Account, Product, Order, and OrderItem. Camel-case client fields map to the existing SQL table and column names. Prices use Prisma Decimal, and foreign-key deletion rules match the original database. `src/db.js` creates Prisma Client with the PostgreSQL driver adapter and three-second connection/query timeouts.

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

`npm run test:today` runs the same Jest suite. Jest uses Node's VM modules flag for this ESM project; Node may print an experimental-feature warning. HTTP tests cover health success/failure, unknown routes and methods, malformed/oversized JSON, body/params/query validation, optional and unknown fields, and safe synchronous/asynchronous errors. Registration and login are also tested; customer, product, and order routes are still planned. The [API design and ERD](api-design.md) document their contracts and access rules.

To include real PostgreSQL verification, create a separate test database and set its connection string:

```powershell
createdb -h localhost -U postgres backend_module_test
$env:TEST_DATABASE_URL = 'postgres://postgres:YOUR_PASSWORD@localhost:5432/backend_module_test'
npm test
Remove-Item Env:TEST_DATABASE_URL
```

The integration check migrates a unique schema, verifies repeated deployment, Prisma model reads/writes, relations, decimal values, unique/check/foreign-key constraints, cascade deletion, transaction rollback, and a healthy response. A second integration check verifies that baselining the legacy schema preserves existing customer data. Each check removes only its generated schema afterward. Without `TEST_DATABASE_URL`, Jest explicitly skips all three database integration tests; successful/failed health responses and missing configuration are still tested.

## Authentication (4 October)

Set `JWT_SECRET` in `.env` to a random secret containing at least 32 bytes before starting the server. Generate one with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the generated value private. Missing or short secrets prevent startup; there is no default production key. After pulling this change, run `npm ci` and `npm run db:migrate` to apply `002_accounts` without resetting existing data.

Register and log in:

```powershell
$registration = @{ name = 'Ada'; email = 'ada@example.com'; password = 'example-password-only' } | ConvertTo-Json
Invoke-RestMethod -Method Post http://localhost:3000/auth/register -ContentType 'application/json' -Body $registration
$credentials = @{ email = 'ada@example.com'; password = 'example-password-only' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post http://localhost:3000/auth/login -ContentType 'application/json' -Body $credentials
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
```

Registration returns 201 with a customer object and a Location header; the referenced customer endpoint is scheduled for 5 October. Login returns `accessToken`, `tokenType: Bearer`, and `expiresIn: 3600`. Invalid fields return 400, duplicate emails 409, and incorrect credentials 401. Email is trimmed/lowercased; passwords are preserved exactly. Public registration always creates the customer role and rejects role/customerId overrides. Both endpoints disable response caching.

Passwords use Node's asynchronous scrypt with a random 16-byte salt, N=131072, r=8, p=1, and timing-safe comparison. Unknown-email login performs the same password derivation. Tokens use jsonwebtoken HS256 with a fixed issuer and audience, a one-hour expiry, and an account ID subject. The reusable `authenticate(database, tokens)` middleware verifies tokens and loads current account permissions; it is tested through a test-only route, ready for future protected business endpoints. There is no public token-verification endpoint, refresh flow, or logout/revocation list. Deleting an account invalidates its tokens on their next use; rotating JWT_SECRET invalidates all tokens. Staff accounts are not publicly registered.

The Account model adds unique normalized email, password hash, role, and an optional unique customer link. SQL CHECK constraints require a customer link for customer accounts and restrict roles. Customer deletion cascades to its login account. Registration wraps both inserts in one database transaction, including duplicate-email race handling.

Authentication tests cover hashing, validation, normalization, duplicate errors, login, invalid/expired/wrong-purpose tokens, current permissions and deleted accounts. With TEST_DATABASE_URL, a third integration test verifies concurrent registration, account constraints, rollback after an account insert conflict, login against persisted hashes, and account cascade deletion. Tests use generated schemas and remove only those schemas.

Rate limiting remains scheduled for 10 October; deployment and HTTPS configuration remain later tasks. Password-hashing and token-library references: [Node crypto](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).
