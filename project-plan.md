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
