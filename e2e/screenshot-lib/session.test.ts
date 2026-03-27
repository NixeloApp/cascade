import { afterEach, describe, expect, it, vi } from "vitest";
import { captureState } from "./capture";
import { enumerateDryRunTargets, formatConfigLabel } from "./session";

describe("screenshot session helpers", () => {
  afterEach(() => {
    captureState.currentConfigPrefix = "";
    captureState.cliOptions = {
      headless: true,
      dryRun: false,
      configFilters: null,
      specFilters: [],
      matchFilters: [],
      shardIndex: null,
      shardTotal: null,
      help: false,
    };
    vi.restoreAllMocks();
  });

  it("formats viewport and theme pairs into config labels", () => {
    expect(formatConfigLabel("desktop", "dark")).toBe("desktop-dark");
    expect(formatConfigLabel("mobile", "light")).toBe("mobile-light");
  });

  it("enumerates only targets that match the active filters", () => {
    captureState.cliOptions = {
      ...captureState.cliOptions,
      configFilters: new Set(["desktop-light"]),
      matchFilters: ["landing"],
    };
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    enumerateDryRunTargets([{ viewport: "desktop", theme: "light" }]);

    const lines = logSpy.mock.calls.map(([line]) => String(line));
    expect(lines.some((line) => line.includes("[public] landing"))).toBe(true);
    expect(lines.some((line) => line.includes("[public] signin"))).toBe(false);
    expect(lines.some((line) => line.includes("Total: 1 screenshots would be captured"))).toBe(
      true,
    );
  });
});
