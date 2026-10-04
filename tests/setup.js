// Test-only key; production startup still requires its own configured secret.
process.env.JWT_SECRET = 'test-only-secret-not-for-production-123456789';
