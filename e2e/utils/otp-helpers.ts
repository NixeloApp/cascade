import { E2E_ENDPOINTS, getE2EHeaders } from "../config";

interface MockOtpPollResult {
  error?: string;
  status?: number;
}

/**
 * Polls the backend for the latest OTP code for a user.
 * Replaces Mailtrap for faster, limitless E2E testing.
 */
export async function waitForMockOTP(
  email: string,
  options: { timeout?: number; pollInterval?: number; type?: "verification" | "reset" } = {},
): Promise<string> {
  // Use global OTP wait timeout as default
  const { timeout = 60000, pollInterval = 2000, type } = options;
  const startTime = Date.now();
  let lastPollResult: MockOtpPollResult = { error: "no OTP response received yet" };

  console.log(`[MockOTP] Polling for OTP for ${email}${type ? ` (type: ${type})` : ""}...`);

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(E2E_ENDPOINTS.getLatestOTP, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email, type }),
      });

      if (!response.ok) {
        const text = await response.text();
        lastPollResult = {
          status: response.status,
          error: text || `HTTP ${response.status}`,
        };
        console.warn(`[MockOTP] API error ${response.status}: ${text}`);
        // Keep retrying
      } else {
        const data = await response.json();
        if (data.code) {
          console.log(`[MockOTP] Found code: ${data.code}`);
          return data.code;
        }
        lastPollResult = { status: response.status, error: "No OTP code available yet" };
      }
    } catch (e) {
      lastPollResult = { error: String(e) };
      console.warn(`[MockOTP] Fetch error: ${e}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  const failureReason =
    typeof lastPollResult.status === "number"
      ? `last response ${lastPollResult.status}: ${lastPollResult.error ?? "unknown"}`
      : `last error: ${lastPollResult.error ?? "unknown"}`;
  throw new Error(
    `Timeout waiting for Mock OTP for ${email} after ${timeout}ms (${failureReason})`,
  );
}
