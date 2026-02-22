import { describe, expect, it } from "vitest";
import { getUserName } from "./userUtils";

describe("userUtils", () => {
  describe("getUserName", () => {
    it("should return name if present", () => {
      expect(getUserName({ name: "Bob" } as any)).toBe("Bob");
    });
    it("should return email if name missing", () => {
      expect(getUserName({ email: "bob@example.com" } as any)).toBe("bob@example.com");
    });
    it("should return Unknown if both missing", () => {
      expect(getUserName({} as any)).toBe("Unknown");
    });
    it("should return Unknown if user is null/undefined", () => {
      expect(getUserName(null)).toBe("Unknown");
      expect(getUserName(undefined)).toBe("Unknown");
    });
    it("should return default name if provided", () => {
        expect(getUserName(null, "Default")).toBe("Default");
        expect(getUserName({}, "Default")).toBe("Default");
    });
  });
});
