import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MailtrapProvider } from "./mailtrap";
import { SendPulseProvider } from "./sendpulse";

// Mock env variables
vi.mock("../lib/env", () => ({
  getMailtrapApiToken: () => "mock-token",
  getMailtrapInboxId: () => "mock-inbox-id",
  getMailtrapFromEmail: () => "mock@example.com",
  getMailtrapMode: () => "sandbox",
  getSendPulseId: () => "mock-id",
  getSendPulseSecret: () => "mock-secret",
  getSendPulseFromEmail: () => "mock@example.com",
}));

describe("Email Providers Timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("MailtrapProvider", () => {
    it("should fail with timeout error when request hangs", async () => {
      const provider = new MailtrapProvider();

      // Mock fetch to hang and respect abort signal
      (global.fetch as any).mockImplementation(async (url: any, options: any) => {
        return new Promise((resolve, reject) => {
          const signal = options?.signal;
          if (signal) {
            if (signal.aborted) {
                const err = new Error("The operation was aborted");
                err.name = "AbortError";
                reject(err);
                return;
            }
            signal.addEventListener("abort", () => {
              const err = new Error("The operation was aborted");
              err.name = "AbortError";
              reject(err);
            });
          }
        });
      });

      const sendPromise = provider.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      // Advance time to trigger timeout
      vi.advanceTimersByTime(10100);

      const result = await sendPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain("Request timed out after 10000ms");
    });

    it("should succeed when request is fast", async () => {
      const provider = new MailtrapProvider();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message_ids: ["msg-1"] }),
      });

      const sendPromise = provider.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      // No need to advance timers, but good practice if there were delays
      // vi.advanceTimersByTime(100);

      const result = await sendPromise;
      expect(result.success).toBe(true);
      expect(result.id).toBe("msg-1");
    });
  });

  describe("SendPulseProvider", () => {
    it("should fail with timeout error when auth request hangs", async () => {
      const provider = new SendPulseProvider();

      (global.fetch as any).mockImplementation(async (url: any, options: any) => {
        return new Promise((resolve, reject) => {
          const signal = options?.signal;
          if (signal) {
             if (signal.aborted) {
                const err = new Error("The operation was aborted");
                err.name = "AbortError";
                reject(err);
                return;
            }
            signal.addEventListener("abort", () => {
              const err = new Error("The operation was aborted");
              err.name = "AbortError";
              reject(err);
            });
          }
        });
      });

      const sendPromise = provider.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      vi.advanceTimersByTime(10100);

      const result = await sendPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain("Request timed out after 10000ms");
    });
  });
});
