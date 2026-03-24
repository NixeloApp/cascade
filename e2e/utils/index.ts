/**
 * E2E Test Utilities - Central Export
 */

// Auth helpers (sign-in flows, token injection)
export * from "./auth-helpers";

// Locator state helpers for resilient polling/recovery
export * from "./locator-state";

// Test namespace helpers (unique entity naming for parallel tests)
export * from "./test-helpers";

// Test user API service (create/delete/seed test users)
export * from "./test-user-service";

// Semantic wait functions (replace arbitrary timeouts)
export * from "./wait-helpers";
