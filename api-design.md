# API Design

## Planned endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Check service availability |
| POST | `/auth/register` | Register a customer |
| POST | `/auth/login` | Authenticate and receive a token |
| GET/POST | `/customers` | List or create customers |
| GET/PATCH/DELETE | `/customers/:id` | Manage one customer |
| GET/POST | `/products` | List or create products |
| GET/PATCH/DELETE | `/products/:id` | Manage one product |
| GET/POST | `/orders` | List or create the authenticated customer’s orders |
| GET | `/orders/:id` | Read an order with its items |
| PATCH | `/orders/:id/status` | Update an order status for authorized staff |

Successful responses will be JSON and use 200, 201, or 204 where appropriate. Invalid input returns 400, missing authentication returns 401, insufficient permissions returns 403, missing resources return 404, and conflicts return 409.

Example error:

```json
{"error":"Validation failed","details":[{"field":"email","message":"Invalid email"}]}
```
