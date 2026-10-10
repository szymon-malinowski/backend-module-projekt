# Daily Todo List

Planning period: 30 September–14 October 2026. Implement only the current day's work and mark tasks complete after verification. Existing completion marks are preserved.

Each day follows `notes/example-plan.md`: three priorities, the main risk, and a mitigation. Send the morning plan between 09:00 and 10:00 Europe/Berlin. After finishing the day's work, write only that day's summary using `notes/example-summary.md`, reporting actual results, the main lesson, and tomorrow's priority. Send the evening update by 23:59. These checklists do not indicate that updates have been sent.

## 30 September 2026

- [x] Define the API purpose, audience, and MVP scope.
- [x] Choose the Node.js, Express, PostgreSQL, Jest, and CORS stack.
- [x] Outline customers, products, orders, and order items.

**Risk:** The scope is too large for an individual project.
**Mitigation:** Keep the MVP focused on the required backend features; exclude a frontend, payments, invoices, and notifications.

## 1 October 2026

- [x] Create the Node.js project scaffold and environment template.
- [x] Document the relational schema and key constraints.
- [x] Document the planned REST endpoints and response conventions.

**Risk:** An unclear schema or API contract causes rework.
**Mitigation:** Review relationships, constraints, and endpoint conventions before implementation.

## 2 October 2026

- [x] Implement the database connection and migrations; migrate the existing scaffold to Prisma ORM.
- [x] Add the first health-check route.
- [x] Verify migration execution and health responses, and document local database setup.

**Risk:** Local PostgreSQL configuration blocks development.
**Mitigation:** Check connection settings early and document reproducible setup steps without credentials.

## 3 October 2026

- [x] Complete the ERD, endpoint access rules, and request/response examples before implementing business routes.
- [x] Add shared request validation and consistent error handling.
- [x] Configure Jest and verify health checks, unknown routes, and safe error responses.

**Risk:** Inconsistent responses make later endpoints harder to maintain.
**Mitigation:** Establish shared conventions and test them before adding CRUD routes.

## 4 October 2026

- [x] Implement account storage and customer registration with password hashing.
- [x] Implement login and token verification.
- [x] Test registration, duplicate accounts, invalid credentials, and invalid or expired tokens.

**Risk:** Authentication exposes sensitive data or accepts invalid credentials.
**Mitigation:** Validate input, keep secrets in environment configuration, and exclude password hashes from responses.

## 5 October 2026

- [x] Implement customer list, detail, create, update, and delete endpoints.
- [x] Enforce staff and customer ownership permissions, including protection against role escalation.
- [x] Test customer CRUD, validation, access denial, and deletion constraints.

**Risk:** A customer can access or modify another customer's data.
**Mitigation:** Enforce permissions on every customer route and test with separate user identities.

## 6 October 2026

- [x] Implement product list, detail, create, update, and delete endpoints.
- [x] Validate prices and stock, restrict writes to staff, and preserve products referenced by order history.
- [x] Test product CRUD, invalid input, forbidden writes, and deletion conflicts.

**Risk:** Product changes break existing order references.
**Mitigation:** Enforce foreign-key constraints and return documented conflicts for disallowed deletion.

## 7 October 2026

- [x] Implement order creation with related order items in a database transaction.
- [x] Calculate totals from stored product prices and record the purchased unit prices.
- [x] Test successful orders, invalid quantities, insufficient stock, and transaction rollback.

**Risk:** Partial writes or concurrent requests produce incorrect stock and orders.
**Mitigation:** Use atomic stock updates or row locks within the transaction and test competing purchases.

## 8 October 2026

- [x] Implement order list and detail endpoints with ownership checks.
- [x] Implement staff-only status updates with documented allowed transitions.
- [x] Test order visibility, missing orders, forbidden updates, and invalid status transitions.

**Risk:** Order data leaks or invalid transitions corrupt the order lifecycle.
**Mitigation:** Filter access by identity and validate each transition against the current status.

## 9 October 2026

- [x] Add bounded pagination to customer, product, and order lists.
- [x] Add product search and order-status filtering.
- [x] Test query validation, empty results, stable ordering, and pagination limits.

**Risk:** Unbounded or unsafe queries degrade performance and expose data.
**Mitigation:** Use parameterized queries, allowlisted query options, and a maximum page size.

## 10 October 2026

- [x] Configure CORS for explicitly approved client origins.
- [x] Add rate limiting for authentication and other sensitive routes.
- [x] Review security settings and test CORS, rate limits, and errors for information leaks.

**Risk:** Development defaults leave the deployed API exposed.
**Mitigation:** Configure origins and secrets per environment and document HTTPS requirements.

## 11 October 2026

- [ ] Run integration tests against an isolated PostgreSQL test database.
- [ ] Fill gaps in successful requests, invalid input, ownership, and authorization coverage.
- [ ] Fix discovered defects and verify migrations from an empty database.

**Risk:** Mocked dependencies hide real database failures.
**Mitigation:** Exercise real constraints and transactions with repeatable fixtures isolated from development data.

## 12 October 2026

- [ ] Complete README installation, configuration, migration, run, and test instructions.
- [ ] Complete API examples, error cases, role rules, and links to the plan and ERD.
- [ ] Follow the setup instructions from a clean environment and correct any gaps.

**Risk:** Another developer cannot reproduce the setup.
**Mitigation:** Verify every documented command and provide placeholder configuration without secrets.

## 13 October 2026

- [ ] Configure the deployment service, persistent database, environment values, and HTTPS.
- [ ] Deploy the API, run migrations, and smoke-test health, authentication, and core workflows.
- [ ] Record the verified live URL and document deployment and recovery steps.

**Risk:** Hosting configuration or migrations prevent the service from starting.
**Mitigation:** Check provider requirements early in the day, inspect sanitized logs, and keep a recovery procedure.

## 14 October 2026

- [ ] Run final regression checks locally and smoke tests against the deployed API.
- [ ] Verify submission materials: repository link, participant name, live URL, documentation, and daily updates.
- [ ] Prepare the technical walkthrough and share the repository and verified backend URL with the instructor.

**Risk:** Missing submission details or unexplained implementation choices delay handoff.
**Mitigation:** Check the definition of done and rehearse the architecture, security, testing, and deployment explanation.

The assignment's final deadline is 19 October 2026 at 23:59. This plan targets completion on 14 October, leaving time for instructor feedback and fixes. Continue required daily updates through the project timeline if work continues.
