import { describe, expect, test, vi } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  test("should log debug messages correctly", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    logger.debug("test debug");
    expect(spy).toHaveBeenCalledWith("[DEBUG] test debug");
    spy.mockRestore();
  });

  test("should log info messages correctly", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("test info");
    expect(spy).toHaveBeenCalledWith("[INFO] test info");
    spy.mockRestore();
  });

  test("should log warn messages correctly", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("test warn");
    expect(spy).toHaveBeenCalledWith("[WARN] test warn");
    spy.mockRestore();
  });

  test("should log error messages correctly", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("test error");
    expect(spy).toHaveBeenCalledWith("[ERROR] test error");
    spy.mockRestore();
  });

  test("should log messages with data correctly", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const data = { key: "value", num: 123 };
    logger.info("test data", data);
    expect(spy).toHaveBeenCalledWith(`[INFO] test data ${JSON.stringify(data)}`);
    spy.mockRestore();
  });

  test("should handle circular references gracefully", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const circular: any = {};
    circular.self = circular;

    logger.error("circular error", circular);
    expect(spy).toHaveBeenCalledWith("[ERROR] circular error [Unable to serialize data]");
    spy.mockRestore();
  });

  test("should not append empty data object", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("empty data", {});
    expect(spy).toHaveBeenCalledWith("[INFO] empty data");
    spy.mockRestore();
  });
});
