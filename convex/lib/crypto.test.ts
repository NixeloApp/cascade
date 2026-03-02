import { describe, expect, it } from "vitest";
import { generateOTP } from "./crypto";

describe("crypto", () => {
  describe("generateOTP", () => {
    it("should generate an 8-digit OTP", () => {
      const otp = generateOTP();

      expect(otp).toHaveLength(8);
    });

    it("should only contain digits", () => {
      const otp = generateOTP();

      expect(otp).toMatch(/^\d{8}$/);
    });

    it("should generate different OTPs on each call", () => {
      const otps = new Set<string>();

      // Generate 100 OTPs
      for (let i = 0; i < 100; i++) {
        otps.add(generateOTP());
      }

      // With 8 digits (10^8 possible values), duplicates should be extremely rare
      expect(otps.size).toBeGreaterThan(95);
    });

    it("should generate cryptographically random values", () => {
      // Generate multiple OTPs and check distribution
      const digitCounts = Array(10).fill(0);

      for (let i = 0; i < 100; i++) {
        const otp = generateOTP();
        for (const char of otp) {
          digitCounts[Number.parseInt(char, 10)]++;
        }
      }

      // Each digit should appear roughly 80 times (800 total digits / 10 possible digits)
      // With some variance allowed (30-150 range)
      for (const count of digitCounts) {
        expect(count).toBeGreaterThan(30);
        expect(count).toBeLessThan(150);
      }
    });
  });
});
