import { describe, expect, it } from "vitest";
import { getClientIp } from "./clientIp";

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

  it("should prioritize X-Real-IP over X-Forwarded-For", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-real-ip": "5.5.5.5",
        "x-forwarded-for": "6.6.6.6",
      },
    });
    expect(getClientIp(req)).toBe("5.5.5.5");
  });

  it("should use X-Client-IP if higher priority headers are missing", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-client-ip": "7.7.7.7",
        "x-forwarded-for": "8.8.8.8",
      },
    });
    expect(getClientIp(req)).toBe("7.7.7.7");
  });

  it("should fallback to X-Forwarded-For first IP", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "9.9.9.9, 10.10.10.10",
      },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("should handle X-Forwarded-For with spaces", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": " 11.11.11.11 , 12.12.12.12 ",
      },
    });
    expect(getClientIp(req)).toBe("11.11.11.11");
  });

  it("should handle mixed case headers (standard Request handles case-insensitivity)", () => {
    // Note: Request headers are case-insensitive by spec.
    // We rely on Request implementation to normalize them.
    const req = new Request("http://localhost", {
      headers: {
        "X-Forwarded-For": "13.13.13.13",
      },
    });
    expect(getClientIp(req)).toBe("13.13.13.13");
  });
});
