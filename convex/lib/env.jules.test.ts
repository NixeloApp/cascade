import { ConvexError } from "convex/values";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMailtrapMode, isLocalhost, requireEnv } from "./env";

describe("convex/lib/env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("requireEnv", () => {
    it("should return the environment variable value if it exists", () => {
      vi.stubEnv("TEST_VAR", "some-value");
      expect(requireEnv("TEST_VAR")).toBe("some-value");
    });

    it("should throw a validation error if the environment variable is missing", () => {
      // Ensure the variable is not set
      vi.stubEnv("TEST_VAR", "");

      try {
        requireEnv("TEST_VAR");
        expect.fail("Expected requireEnv to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<any>;
        expect(convexError.data.code).toBe("VALIDATION");
        expect(convexError.data.field).toBe("TEST_VAR");
      }
    });
  });

  describe("isLocalhost", () => {
    it("should return true for localhost", () => {
      vi.stubEnv("CONVEX_SITE_URL", "http://localhost:3000");
      expect(isLocalhost()).toBe(true);
    });

    it("should return true for 127.0.0.1", () => {
      vi.stubEnv("CONVEX_SITE_URL", "http://127.0.0.1:3000");
      expect(isLocalhost()).toBe(true);
    });

    it("should return true for ::1", () => {
      vi.stubEnv("CONVEX_SITE_URL", "http://[::1]:3000");
      expect(isLocalhost()).toBe(true);
    });

    it("should return false for other domains", () => {
      vi.stubEnv("CONVEX_SITE_URL", "https://example.com");
      expect(isLocalhost()).toBe(false);
    });

    it("should return false if CONVEX_SITE_URL is invalid", () => {
      vi.stubEnv("CONVEX_SITE_URL", "not-a-valid-url");
      expect(isLocalhost()).toBe(false);
    });

    it("should return false if CONVEX_SITE_URL is missing", () => {
      // requireEnv throws if missing, but isLocalhost catches errors
      // However, looking at implementation:
      // try { const siteUrl = getConvexSiteUrl(); ... } catch { return false; }
      // getConvexSiteUrl calls requireEnv("CONVEX_SITE_URL") which throws.
      // So it should be caught and return false.
      vi.stubEnv("CONVEX_SITE_URL", "");
      expect(isLocalhost()).toBe(false);
    });
  });

  describe("getMailtrapMode", () => {
    it("should return 'sandbox' when MAILTRAP_MODE is sandbox", () => {
      vi.stubEnv("MAILTRAP_MODE", "sandbox");
      expect(getMailtrapMode()).toBe("sandbox");
    });

    it("should return 'production' when MAILTRAP_MODE is production", () => {
      vi.stubEnv("MAILTRAP_MODE", "production");
      expect(getMailtrapMode()).toBe("production");
    });

    it("should throw validation error for invalid values", () => {
      vi.stubEnv("MAILTRAP_MODE", "invalid-mode");
      try {
        getMailtrapMode();
        expect.fail("Expected getMailtrapMode to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<any>;
        expect(convexError.data.code).toBe("VALIDATION");
        expect(convexError.data.field).toBe("MAILTRAP_MODE");
      }
    });

    it("should throw validation error if MAILTRAP_MODE is missing", () => {
      vi.stubEnv("MAILTRAP_MODE", "");
      try {
        getMailtrapMode();
        expect.fail("Expected getMailtrapMode to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(ConvexError);
        const convexError = error as ConvexError<any>;
        expect(convexError.data.code).toBe("VALIDATION");
        // It fails at requireEnv first
        expect(convexError.data.field).toBe("MAILTRAP_MODE");
      }
    });
  });
});
