import { describe, expect, it } from "vitest";
import {
  getClientIp,
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

      // Expanded loopback
      expect(isPrivateIPv6("0:0:0:0:0:0:0:1")).toBe(true);
      // Leading zeros loopback
      expect(isPrivateIPv6("::0001")).toBe(true);
      // Unspecified address variations
      expect(isPrivateIPv6("0::0")).toBe(true);
      expect(isPrivateIPv6("0:0:0:0:0:0:0:0")).toBe(true);

      // IPv4-compatible
      expect(isPrivateIPv6("::127.0.0.1")).toBe(true);
      // Site-Local
      expect(isPrivateIPv6("fec0::1")).toBe(true);
      // NAT64 private
      expect(isPrivateIPv6("64:ff9b::127.0.0.1")).toBe(true);
    });

    it("allows public IPs", () => {
      expect(isPrivateIPv6("2001:4860:4860::8888")).toBe(false);
      // IPv4-compatible public
      expect(isPrivateIPv6("::1.2.3.4")).toBe(false);
      // NAT64 public
      expect(isPrivateIPv6("64:ff9b::1.2.3.4")).toBe(false);
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

  describe("getClientIp", () => {
    it("should return null if no headers are present", () => {
      const req = new Request("http://localhost");
      expect(getClientIp(req)).toBeNull();
    });

    it("should prioritize CF-Connecting-IP", () => {
      const req = new Request("http://localhost", {
        headers: {
          "cf-connecting-ip": "1.1.1.1",
          "x-forwarded-for": "2.2.2.2",
        },
      });
      expect(getClientIp(req)).toBe("1.1.1.1");
    });

    it("should prioritize True-Client-IP over X-Real-IP", () => {
      const req = new Request("http://localhost", {
        headers: {
          "true-client-ip": "3.3.3.3",
          "x-real-ip": "4.4.4.4",
        },
      });
      expect(getClientIp(req)).toBe("3.3.3.3");
    });

    it("should prioritize X-Forwarded-For over X-Real-IP", () => {
      const req = new Request("http://localhost", {
        headers: {
          "x-real-ip": "5.5.5.5",
          "x-forwarded-for": "6.6.6.6",
        },
      });
      expect(getClientIp(req)).toBe("6.6.6.6");
    });

    it("should prioritize X-Forwarded-For over X-Client-IP", () => {
      const req = new Request("http://localhost", {
        headers: {
          "x-client-ip": "7.7.7.7",
          "x-forwarded-for": "8.8.8.8",
        },
      });
      expect(getClientIp(req)).toBe("8.8.8.8");
    });

    it("should fallback to X-Forwarded-For last IP (trusted proxy assumption)", () => {
      const req = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "9.9.9.9, 10.10.10.10",
        },
      });
      expect(getClientIp(req)).toBe("10.10.10.10");
    });

    it("should resist spoofing via prepended X-Forwarded-For", () => {
      // Attacker sends X-Forwarded-For: 127.0.0.1
      // Load balancer appends real client IP, resulting in: "127.0.0.1, 203.0.113.50"
      const req = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "127.0.0.1, 203.0.113.50",
        },
      });
      expect(getClientIp(req)).toBe("203.0.113.50");
    });

    it("should handle X-Forwarded-For with spaces", () => {
      const req = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": " 11.11.11.11 , 12.12.12.12 ",
        },
      });
      expect(getClientIp(req)).toBe("12.12.12.12");
    });

    it("should handle mixed case headers", () => {
      const req = new Request("http://localhost", {
        headers: {
          "X-Forwarded-For": "13.13.13.13",
        },
      });
      expect(getClientIp(req)).toBe("13.13.13.13");
    });

    it("should prioritize X-Forwarded-For over Fastly-Client-IP", () => {
      const req = new Request("http://localhost", {
        headers: {
          "fastly-client-ip": "14.14.14.14",
          "x-forwarded-for": "15.15.15.15",
        },
      });
      expect(getClientIp(req)).toBe("15.15.15.15");
    });
  });
});
