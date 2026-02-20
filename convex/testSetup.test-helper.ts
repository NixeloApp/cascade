/// <reference types="vite/client" />

/**
 * Test setup file for Convex backend tests
 *
 * Uses import.meta.glob for automatic module discovery with pnpm.
 *
 * @see https://docs.convex.dev/testing/convex-test
 */

import { vi } from "vitest";

// Set global flag to skip audit logs in tests
global.IS_TEST_ENV = true;
process.env.IS_TEST_ENV = "true";
// Skip usage recording in tests to prevent "Write outside of transaction" errors in convex-test
process.env.SKIP_USAGE_RECORDING = "true";

// Stub required env vars to prevent validation errors in background actions
process.env.MAILTRAP_API_TOKEN = "mock-token";
process.env.MAILTRAP_INBOX_ID = "12345";
process.env.MAILTRAP_FROM_EMAIL = "test@example.com";
process.env.MAILTRAP_MODE = "sandbox";
process.env.RESEND_API_KEY = "mock-key";

// Use import.meta.glob to automatically discover all Convex modules
const modulesMap = import.meta.glob("./**/!(*.*.*|_generated|*.test)*.*s");

// Mock fetch globally
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  text: async () => "ok",
  json: async () => ({}),
} as Response);

export const modules = modulesMap;
