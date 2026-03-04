/**
 * Build a Slack-style signed HTTP request for testing slash-command/unfurl endpoints.
 *
 * @param params.url - Target HTTP endpoint URL.
 * @param params.body - Raw form-encoded request body used for signature generation.
 * @param params.secret - Slack signing secret used to compute `x-slack-signature`.
 * @param params.timestamp - Optional UNIX timestamp override for deterministic tests.
 * @returns A POST `Request` containing Slack signature and timestamp headers.
 */
export async function buildSlackSignedRequest(params: {
  url: string;
  body: string;
  secret: string;
  timestamp?: number;
}): Promise<Request> {
  const timestamp = params.timestamp ?? Math.floor(Date.now() / 1000);
  const ts = `${timestamp}`;
  const baseString = `v0:${ts}:${params.body}`;
  const signature = await hmacSha256(params.secret, baseString);

  return new Request(params.url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-slack-request-timestamp": ts,
      "x-slack-signature": `v0=${signature}`,
    },
    body: params.body,
  });
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
