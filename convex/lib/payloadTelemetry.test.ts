import { afterEach, describe, expect, it, vi } from "vitest";
import { estimatePayloadBytes, logQueryPayloadTelemetry } from "./payloadTelemetry";

describe("payloadTelemetry", () => {
  const originalTelemetry = process.env.ENABLE_QUERY_PAYLOAD_TELEMETRY;
  const originalTestEnv = process.env.IS_TEST_ENV;

  afterEach(() => {
    process.env.ENABLE_QUERY_PAYLOAD_TELEMETRY = originalTelemetry;
    process.env.IS_TEST_ENV = originalTestEnv;
    vi.restoreAllMocks();
  });

  it("estimates payload bytes from JSON", () => {
    const bytes = estimatePayloadBytes({ id: "abc", count: 2 });
    expect(bytes).toBeGreaterThan(0);
  });

  it("logs when telemetry env is enabled outside test env", () => {
    process.env.ENABLE_QUERY_PAYLOAD_TELEMETRY = "true";
    delete process.env.IS_TEST_ENV;
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logQueryPayloadTelemetry("dashboard.getMyIssues", { page: [1, 2, 3] }, { returned: 3 });

    expect(infoSpy).toHaveBeenCalledOnce();
  });

  it("does not log in test env", () => {
    process.env.ENABLE_QUERY_PAYLOAD_TELEMETRY = "true";
    process.env.IS_TEST_ENV = "true";
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logQueryPayloadTelemetry("dashboard.getMyIssues", { page: [1, 2, 3] });

    expect(infoSpy).not.toHaveBeenCalled();
  });
});
