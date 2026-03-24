import type { TestInfo } from "@playwright/test";

/**
 * Test Namespace Helpers
 *
 * Provides unique, collision-free naming for entities created in parallel E2E tests.
 */

function sanitizeNamespaceSegment(value: string, maxLength: number): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.slice(0, maxLength) || "test";
}

export type TestNamespace = {
  id: string;
  name: (label: string) => string;
  projectKey: (prefix: string) => string;
  token: (label: string) => string;
};

/**
 * Build a shared run-scoped namespace for entity names created inside a test.
 * Centralizes the uniqueness pattern so multi-entity specs stop hand-rolling
 * `Date.now()` values with inconsistent prefixes and suffix trimming.
 */
export function createTestNamespace(testInfo: TestInfo): TestNamespace {
  const runStamp = Date.now().toString(36);
  const id = `w${testInfo.parallelIndex}e${testInfo.repeatEachIndex}r${testInfo.retry}${runStamp}`;
  const compactId = id.replace(/[^a-z0-9]/gi, "").toUpperCase();

  return {
    id,
    name: (label: string) => `${label} ${id}`,
    projectKey: (prefix: string) => {
      const normalizedPrefix =
        prefix
          .replace(/[^a-z]/gi, "")
          .toUpperCase()
          .slice(0, 4) || "TST";
      return `${normalizedPrefix}${compactId.slice(-4)}`;
    },
    token: (label: string) => `${sanitizeNamespaceSegment(label, 12)}-${id}`,
  };
}
