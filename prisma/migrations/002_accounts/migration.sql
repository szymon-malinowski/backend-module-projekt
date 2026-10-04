BEGIN;
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    customer_id INTEGER UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT accounts_role_check CHECK (role IN ('customer', 'staff')),
    CONSTRAINT accounts_customer_check CHECK (role <> 'customer' OR customer_id IS NOT NULL),
    CONSTRAINT accounts_email_normalized CHECK (email = lower(btrim(email)))
);
COMMIT;
