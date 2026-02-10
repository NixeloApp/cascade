import { E2E_ENDPOINTS, getE2EHeaders } from "../config";

/**
 * Polls the backend for the latest OTP code for a user.
 * Replaces Mailtrap for faster, limitless E2E testing.
 */
export async function waitForMockOTP(
  email: string,
  options: { timeout?: number; pollInterval?: number } = {},
): Promise<string> {
  const { timeout = 40000, pollInterval = 500 } = options;
  const startTime = Date.now();

  console.log(`[MockOTP] Polling for OTP for ${email}...`);

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(E2E_ENDPOINTS.getLatestOTP, {
        method: "POST",
        headers: getE2EHeaders(),
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`[MockOTP] API error ${response.status}: ${text}`);
        // Keep retrying
        continue;
      }

      const data = await response.json();
      if (data.code) {
        console.log(`[MockOTP] Found code: ${data.code}`);
        return data.code;
      }
    } catch (e) {
      console.warn(`[MockOTP] Fetch error: ${e}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Timeout waiting for Mock OTP for ${email} after ${timeout}ms`);
}
