import { describe, expect, it } from "vitest";
import { collectBannedScreenshotProdHooks, run } from "./check-screenshot-prod-hooks.js";

const EXPECTED_VIOLATION_COUNT = 12;
const EXAMPLE_FILE_PATH_SUFFIX = "tmp/example.tsx";

describe("check-screenshot-prod-hooks", () => {
  it("flags removed screenshot-only editor hook strings in production code", () => {
    const violations = collectBannedScreenshotProdHooks(
      `
        window.addEventListener("nixelo:e2e-open-slash-menu", handleOpen);
        if (window.__NIXELO_E2E_MARKDOWN_IMPORT__) {
          return;
        }
        window.sessionStorage.setItem("nixelo:e2e:roadmap-state", "detail");
        window.sessionStorage.setItem("nixelo:e2e:notifications-state", "archived-tab");
        window.sessionStorage.setItem("nixelo:e2e:project-inbox-state", "decline-dialog");
        window.sessionStorage.setItem("nixelo:e2e:invoices-state", "filtered-empty");
        if (window.__NIXELO_E2E_TIME_TRACKING_STATE__) {
          return;
        }
        window.sessionStorage.setItem("nixelo:e2e:my-issues-state", "filter-active");
        if (window.__NIXELO_E2E_MY_ISSUES_LOADING__) {
          return;
        }
        if (window.__NIXELO_E2E_ORG_CALENDAR_LOADING__) {
          return;
        }
        if (window.__NIXELO_E2E_INVOICES_LOADING__) {
          return;
        }
        if (window.__NIXELO_E2E_BOARD_LOADING__) {
          return;
        }
      `,
      "/tmp/example.tsx",
    );

    expect(violations).toHaveLength(EXPECTED_VIOLATION_COUNT);
    expect(violations[0]).toMatchObject({
      line: 2,
      pattern: "nixelo:e2e-open-slash-menu",
    });
    expect(violations[0]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[1]).toMatchObject({
      line: 3,
      pattern: "__NIXELO_E2E_MARKDOWN_IMPORT__",
    });
    expect(violations[1]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[2]).toMatchObject({
      line: 6,
      pattern: "nixelo:e2e:roadmap-state",
    });
    expect(violations[2]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[3]).toMatchObject({
      line: 7,
      pattern: "nixelo:e2e:notifications-state",
    });
    expect(violations[3]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[4]).toMatchObject({
      line: 8,
      pattern: "nixelo:e2e:project-inbox-state",
    });
    expect(violations[4]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[5]).toMatchObject({
      line: 9,
      pattern: "nixelo:e2e:invoices-state",
    });
    expect(violations[5]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[6]).toMatchObject({
      line: 10,
      pattern: "__NIXELO_E2E_TIME_TRACKING_STATE__",
    });
    expect(violations[6]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[7]).toMatchObject({
      line: 13,
      pattern: "nixelo:e2e:my-issues-state",
    });
    expect(violations[7]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[8]).toMatchObject({
      line: 14,
      pattern: "__NIXELO_E2E_MY_ISSUES_LOADING__",
    });
    expect(violations[8]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[9]).toMatchObject({
      line: 17,
      pattern: "__NIXELO_E2E_ORG_CALENDAR_LOADING__",
    });
    expect(violations[9]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[10]).toMatchObject({
      line: 20,
      pattern: "__NIXELO_E2E_INVOICES_LOADING__",
    });
    expect(violations[10]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
    expect(violations[11]).toMatchObject({
      line: 23,
      pattern: "__NIXELO_E2E_BOARD_LOADING__",
    });
    expect(violations[11]?.file.endsWith(EXAMPLE_FILE_PATH_SUFFIX)).toBe(true);
  });

  it("passes against the current repo state", () => {
    const result = run();

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
  });
});
