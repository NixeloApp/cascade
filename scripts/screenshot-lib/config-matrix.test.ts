import { describe, expect, it } from "vitest";
import { formatViewportThemeConfigLabel, runConfigMatrix } from "../../e2e/utils/config-matrix";

describe("config matrix helpers", () => {
  it("formats viewport/theme configs into stable labels", () => {
    expect(
      formatViewportThemeConfigLabel({
        theme: "dark",
        viewport: "desktop",
      }),
    ).toBe("desktop-dark");
    expect(
      formatViewportThemeConfigLabel({
        theme: "light",
        viewport: "mobile",
      }),
    ).toBe("mobile-light");
  });

  it("runs config callbacks sequentially with labels and indexes", async () => {
    const callOrder: string[] = [];

    await runConfigMatrix(
      [
        { theme: "dark", viewport: "desktop" },
        { theme: "light", viewport: "tablet" },
      ] as const,
      async ({ config, index, label }) => {
        callOrder.push(`start:${index}:${label}`);
        await Promise.resolve();
        callOrder.push(`end:${config.viewport}:${config.theme}`);
      },
    );

    expect(callOrder).toEqual([
      "start:0:desktop-dark",
      "end:desktop:dark",
      "start:1:tablet-light",
      "end:tablet:light",
    ]);
  });
});
