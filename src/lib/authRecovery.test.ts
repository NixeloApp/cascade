import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAuthenticatedSessionMarker,
  hasRecoverableAuthenticatedSession,
  hasStoredConvexAuthSession,
  markAuthenticatedSession,
  readLocalStorageJson,
  removeLocalStorageValue,
  writeLocalStorageJson,
} from "./authRecovery";

const TEST_STORAGE_KEY = "nixelo-auth-recovery-test";

describe("authRecovery", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("detects stored Convex auth tokens", () => {
    expect(hasStoredConvexAuthSession()).toBe(false);

    localStorage.setItem("convexAuthToken", "jwt-token");

    expect(hasStoredConvexAuthSession()).toBe(true);
  });

  it("treats a persisted authenticated marker as recoverable session state", () => {
    expect(hasRecoverableAuthenticatedSession()).toBe(false);

    markAuthenticatedSession();

    expect(hasRecoverableAuthenticatedSession()).toBe(true);

    clearAuthenticatedSessionMarker();

    expect(hasRecoverableAuthenticatedSession()).toBe(false);
  });

  it("reads and writes JSON payloads safely", () => {
    writeLocalStorageJson(TEST_STORAGE_KEY, {
      redirectPath: "/org/dashboard",
      userOrganizations: [{ slug: "org" }],
    });

    expect(
      readLocalStorageJson<{
        redirectPath: string;
        userOrganizations: Array<{ slug: string }>;
      }>(TEST_STORAGE_KEY),
    ).toEqual({
      redirectPath: "/org/dashboard",
      userOrganizations: [{ slug: "org" }],
    });

    removeLocalStorageValue(TEST_STORAGE_KEY);

    expect(readLocalStorageJson(TEST_STORAGE_KEY)).toBeUndefined();
  });

  it("returns undefined for invalid cached JSON", () => {
    localStorage.setItem(TEST_STORAGE_KEY, "{bad json");

    expect(readLocalStorageJson(TEST_STORAGE_KEY)).toBeUndefined();
  });

  it("falls back safely when localStorage throws", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(hasRecoverableAuthenticatedSession()).toBe(false);
    expect(readLocalStorageJson(TEST_STORAGE_KEY)).toBeUndefined();

    getItemSpy.mockRestore();
  });
});
