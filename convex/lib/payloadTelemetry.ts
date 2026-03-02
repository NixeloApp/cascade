const TELEMETRY_ENV = "ENABLE_QUERY_PAYLOAD_TELEMETRY";

function isEnabled(): boolean {
  if (process.env.IS_TEST_ENV) {
    return false;
  }
  const value = process.env[TELEMETRY_ENV];
  return value === "1" || value === "true";
}

/**
 * Estimates serialized payload size in bytes for lightweight telemetry reporting.
 */
export function estimatePayloadBytes(payload: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(payload)).length;
  } catch {
    return 0;
  }
}

/**
 * Emits query payload telemetry when enabled by environment configuration.
 */
export function logQueryPayloadTelemetry(
  queryName: string,
  payload: unknown,
  meta: Record<string, string | number | boolean> = {},
): void {
  if (!isEnabled()) {
    return;
  }

  const payloadBytes = estimatePayloadBytes(payload);
  const payloadKiB = (payloadBytes / 1024).toFixed(2);
  const metaText = Object.entries(meta)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  if (metaText) {
    console.info(
      `[bandwidth.telemetry] query=${queryName} payloadBytes=${payloadBytes} payloadKiB=${payloadKiB} ${metaText}`,
    );
    return;
  }

  console.info(
    `[bandwidth.telemetry] query=${queryName} payloadBytes=${payloadBytes} payloadKiB=${payloadKiB}`,
  );
}
