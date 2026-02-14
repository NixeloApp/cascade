import { describe, expect, it } from "vitest";
import {
  isAmbiguousIP,
  isPrivateIPv4,
  isPrivateIPv6,
  isStrictIPv4,
  isStrictIPv6,
  validateDestination,
} from "./ssrf";

describe("SSRF Validation", () => {
  describe("isStrictIPv4", () => {
    it("accepts valid strict IPv4", () => {
      expect(isStrictIPv4("1.2.3.4")).toBe(true);
      expect(isStrictIPv4("255.255.255.255")).toBe(true);
      expect(isStrictIPv4("0.0.0.0")).toBe(true);
    });

    it("rejects invalid IPv4", () => {
      expect(isStrictIPv4("1.2.3")).toBe(false);
      expect(isStrictIPv4("1.2.3.4.5")).toBe(false);
      expect(isStrictIPv4("256.0.0.0")).toBe(false);
      expect(isStrictIPv4("1.2.3.a")).toBe(false);
      expect(isStrictIPv4("01.02.03.04")).toBe(false); // Leading zeros not allowed
      expect(isStrictIPv4("0x1.0.0.1")).toBe(false);
    });
  });

  describe("isStrictIPv6", () => {
    it("accepts valid strict IPv6", () => {
      expect(isStrictIPv6("2001:db8::1")).toBe(true);
      expect(isStrictIPv6("::1")).toBe(true);
      expect(isStrictIPv6("fe80::1")).toBe(true);
    });

    it("rejects invalid IPv6", () => {
      expect(isStrictIPv6("2001:db8::1::1")).toBe(false);
      expect(isStrictIPv6("g:0:0:0:0:0:0:0")).toBe(false);
    });
  });

  describe("isPrivateIPv4", () => {
    it("detects private ranges", () => {
      expect(isPrivateIPv4("10.0.0.1")).toBe(true);
      expect(isPrivateIPv4("172.16.0.1")).toBe(true);
      expect(isPrivateIPv4("192.168.1.1")).toBe(true);
      expect(isPrivateIPv4("127.0.0.1")).toBe(true);
      expect(isPrivateIPv4("169.254.1.1")).toBe(true);
      expect(isPrivateIPv4("0.0.0.0")).toBe(true);
      expect(isPrivateIPv4("100.64.0.1")).toBe(true); // CGNAT
    });

    it("allows public IPs", () => {
      expect(isPrivateIPv4("8.8.8.8")).toBe(false);
      expect(isPrivateIPv4("1.1.1.1")).toBe(false);
      expect(isPrivateIPv4("172.32.0.1")).toBe(false);
    });
  });

  describe("isPrivateIPv6", () => {
    it("detects private ranges", () => {
      expect(isPrivateIPv6("::1")).toBe(true);
      expect(isPrivateIPv6("fe80::1")).toBe(true);
      expect(isPrivateIPv6("fc00::1")).toBe(true);
      expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
    });

    it("allows public IPs", () => {
      expect(isPrivateIPv6("2001:4860:4860::8888")).toBe(false);
    });
  });

  describe("isAmbiguousIP", () => {
    it("detects ambiguous IPs", () => {
      expect(isAmbiguousIP("127.1")).toBe(true);
      expect(isAmbiguousIP("0177.0.0.1")).toBe(true);
      expect(isAmbiguousIP("2130706433")).toBe(true); // Integer
      expect(isAmbiguousIP("0x7f000001")).toBe(true); // Hex
      expect(isAmbiguousIP("1.2.3")).toBe(true); // Partial
    });

    it("allows valid strict IPs", () => {
      expect(isAmbiguousIP("127.0.0.1")).toBe(false); // Handled by strict/private check
      expect(isAmbiguousIP("8.8.8.8")).toBe(false);
    });

    it("allows standard domains", () => {
      expect(isAmbiguousIP("example.com")).toBe(false);
      expect(isAmbiguousIP("google.com")).toBe(false);
    });

    it("rejects domains with numeric TLDs", () => {
      expect(isAmbiguousIP("example.123")).toBe(true);
      expect(isAmbiguousIP("1.2.3.4")).toBe(false); // Valid IP not ambiguous (wait, it returns false because it IS strict IP)
    });
  });

  describe("validateDestination", () => {
    it("accepts valid public URLs", () => {
      expect(() => validateDestination("https://example.com/webhook")).not.toThrow();
      expect(() => validateDestination("https://8.8.8.8/webhook")).not.toThrow();
    });

    it("rejects private IPs", () => {
      expect(() => validateDestination("http://127.0.0.1/")).toThrow(/Private IP/);
      expect(() => validateDestination("http://169.254.169.254/")).toThrow(/Private IP/);
      expect(() => validateDestination("http://0.0.0.0/")).toThrow(/Private IP/);
    });

    it("rejects ambiguous/bypass IPs", () => {
      // 127.1, 0177.0.0.1, etc might be normalized to 127.0.0.1 by URL parser, triggering Private IP check
      // Or if not normalized, they trigger Ambiguous IP check.
      // Either way, they must be rejected.
      expect(() => validateDestination("http://127.1/")).toThrow(/Private IP|Ambiguous/);
      expect(() => validateDestination("http://0177.0.0.1/")).toThrow(/Private IP|Ambiguous/);
      expect(() => validateDestination("http://2130706433/")).toThrow(/Private IP|Ambiguous/);
      expect(() => validateDestination("http://0x7f.0.0.1/")).toThrow(/Private IP|Ambiguous/);
    });

    it("rejects restricted hostnames", () => {
      expect(() => validateDestination("http://localhost/")).toThrow(/Restricted/);
      expect(() => validateDestination("http://169.254.169.254/")).toThrow(/Private IP/); // Caught by private check first
    });

    it("rejects IPv6 private", () => {
      expect(() => validateDestination("http://[::1]/")).toThrow(/Private IP/);
      expect(() => validateDestination("http://[fe80::1]/")).toThrow(/Private IP/);
    });
  });
});
