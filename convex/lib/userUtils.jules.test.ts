import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import {
  sanitizeUserForAuth,
  sanitizeUserForCurrent,
  sanitizeUserForPublic,
  sanitizeUsersForAuth,
  sanitizeUsersForPublic,
  getUserName,
} from "./userUtils";

describe("User Sanitization Utils", () => {
  // Create a mock user with ALL fields populated, including sensitive ones
  const mockUser: Doc<"users"> = {
    _id: "u123" as any,
    _creationTime: 1234567890,
    name: "Test User",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
    emailVerificationTime: 1234567890,
    phone: "+15551234567",
    phoneVerificationTime: 1234567890,
    isAnonymous: false,
    defaultOrganizationId: "o123" as any,
    bio: "Test Bio",
    timezone: "UTC",
    emailNotifications: true,
    desktopNotifications: false,
    inviteId: "i123" as any,
    isTestUser: true,
    testUserCreatedAt: 1234567890,
    // Sensitive fields that MUST be stripped
    pendingEmail: "new@example.com",
    pendingEmailVerificationToken: "token123",
    pendingEmailVerificationExpires: 9999999999,
    twoFactorEnabled: true,
    twoFactorSecret: "secret123",
    twoFactorBackupCodes: ["code1", "code2"],
    twoFactorVerifiedAt: 1234567890,
    twoFactorFailedAttempts: 0,
    twoFactorLockedUntil: 0,
  };

  describe("sanitizeUserForPublic", () => {
    it("should return only public fields", () => {
      const result = sanitizeUserForPublic(mockUser);
      expect(result).toEqual({
        _id: mockUser._id,
        name: mockUser.name,
        image: mockUser.image,
      });
    });

    it("should handle null/undefined", () => {
      expect(sanitizeUserForPublic(null)).toBeNull();
      expect(sanitizeUserForPublic(undefined)).toBeNull();
    });

    it("should not include email", () => {
      const result = sanitizeUserForPublic(mockUser);
      expect(result).not.toHaveProperty("email");
      // @ts-expect-error - Checking runtime property existence
      expect(result.email).toBeUndefined();
    });
  });

  describe("sanitizeUserForAuth", () => {
    it("should return authenticated fields (including email)", () => {
      const result = sanitizeUserForAuth(mockUser);
      expect(result).toEqual({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        image: mockUser.image,
      });
    });

    it("should handle null/undefined", () => {
      expect(sanitizeUserForAuth(null)).toBeNull();
      expect(sanitizeUserForAuth(undefined)).toBeNull();
    });

    it("should not include sensitive fields like phone or 2FA", () => {
      const result = sanitizeUserForAuth(mockUser);
      // @ts-expect-error - Runtime check
      expect(result.phone).toBeUndefined();
      // @ts-expect-error - Runtime check
      expect(result.twoFactorSecret).toBeUndefined();
    });
  });

  describe("sanitizeUserForCurrent", () => {
    it("should return profile fields but exclude sensitive tokens", () => {
      const result = sanitizeUserForCurrent(mockUser);

      // Should include profile info
      expect(result).toMatchObject({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        bio: mockUser.bio,
        timezone: mockUser.timezone,
        isTestUser: mockUser.isTestUser,
      });

      // Should explicitly exclude sensitive auth tokens
      // @ts-expect-error - Runtime check
      expect(result.pendingEmailVerificationToken).toBeUndefined();
      // @ts-expect-error - Runtime check
      expect(result.twoFactorSecret).toBeUndefined();
      // @ts-expect-error - Runtime check
      expect(result.twoFactorBackupCodes).toBeUndefined();
    });

    it("should handle null/undefined", () => {
      expect(sanitizeUserForCurrent(null)).toBeNull();
      expect(sanitizeUserForCurrent(undefined)).toBeNull();
    });
  });

  describe("sanitizeUsersForPublic", () => {
    it("should sanitize an array of users", () => {
      const users = [mockUser, null, mockUser];
      const result = sanitizeUsersForPublic(users);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        _id: mockUser._id,
        name: mockUser.name,
        image: mockUser.image,
      });
      expect(result[1]).toBeNull();
      expect(result[2]).toEqual({
        _id: mockUser._id,
        name: mockUser.name,
        image: mockUser.image,
      });
    });
  });

  describe("sanitizeUsersForAuth", () => {
    it("should sanitize an array of users", () => {
      const users = [mockUser, null];
      const result = sanitizeUsersForAuth(users);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        _id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        image: mockUser.image,
      });
      expect(result[1]).toBeNull();
    });
  });

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
    it("should use default name if provided", () => {
      expect(getUserName(null, "Deleted User")).toBe("Deleted User");
    });
  });
});
