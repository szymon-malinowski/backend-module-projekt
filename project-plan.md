# REST API Project Plan

## Purpose

Build an individual REST API for managing customers, products, orders, and order items. The first version will demonstrate persistent PostgreSQL storage, related entities, authentication and authorization, validation, CRUD operations, tests, documentation, and deployment.

## Technology choices

- Node.js and npm provide the runtime and dependency management.
- Express provides the HTTP server and routing.
- PostgreSQL stores related business data persistently.
- Jest will test successful requests, invalid input, and authorization failures.
- CORS will be configured for approved clients.

## Data model

`customers` have many `orders`. Each `order` has many `order_items`, and each `order_item` references one `product`. This preserves order history while allowing products to be managed independently.

## MVP risk

The scope could become too large for one person. The MVP therefore excludes a frontend, payment processing, invoicing, and notifications.

## Delivery schedule

The [daily todo list](daily-todos.md) covers every day from 30 September through 14 October 2026 with three priorities, a risk, and a mitigation.

- 30 September–1 October: scope, scaffold, schema, and API planning.
- 2–3 October: database migrations, health check, design details, validation, error handling, and test setup.
- 4–6 October: authentication, authorization, and customer/product CRUD.
- 7–9 October: transactional orders, order access and status rules, pagination, and filtering.
- 10–11 October: security configuration, integration tests, and defect fixes.
- 12–14 October: reproducible documentation, deployment, final verification, and handoff.

Implement work one day at a time. Write a daily summary only after completing that day's work, using `notes/example-summary.md` and reporting actual results. Target delivery is 14 October; the assignment deadline is 19 October 2026 at 23:59 Europe/Berlin.
