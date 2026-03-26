import { describe, expect, it } from "vitest";
import {
  createCountRatchetResult,
  createValidatorResult,
  normalizeValidatorResult,
} from "./result-utils.js";

describe("normalizeValidatorResult", () => {
  it("defaults validators to enforced blocking checks", () => {
    const result = normalizeValidatorResult({
      errors: 2,
      messages: ["problem"],
      detail: "2 findings",
    });

    expect(result.blocking).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.errors).toBe(2);
    expect(result.findings).toBe(2);
    expect(result.showMessagesOnPass).toBe(false);
  });

  it("keeps audit validators non-blocking", () => {
    const result = normalizeValidatorResult({
      blocking: false,
      errors: 3,
      messages: ["audit finding"],
      detail: "3 findings",
    });

    expect(result.blocking).toBe(false);
    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.findings).toBe(3);
    expect(result.showMessagesOnPass).toBe(true);
  });

  it("rejects enforced failures that do not report errors", () => {
    expect(() =>
      normalizeValidatorResult({
        passed: false,
        errors: 0,
        detail: "broken result",
      }),
    ).toThrow(/passed=false requires errors >= 1/);
  });

  it("rejects enforced passes that still report errors", () => {
    expect(() =>
      normalizeValidatorResult({
        passed: true,
        errors: 1,
        detail: "broken result",
      }),
    ).toThrow(/passed=true requires errors === 0/);
  });
});

describe("createValidatorResult", () => {
  it("filters empty messages and preserves explicit showMessagesOnPass", () => {
    const result = createValidatorResult({
      errors: 0,
      messages: ["", "kept"],
      showMessagesOnPass: false,
      detail: "clean",
    });

    expect(result.messages).toEqual(["kept"]);
    expect(result.showMessagesOnPass).toBe(false);
    expect(result.passed).toBe(true);
  });
});

describe("createCountRatchetResult", () => {
  const analysis = {
    totalBaselined: 4,
    activeKeyCount: 2,
  };

  it("can count overages by entry", () => {
    const result = createCountRatchetResult({
      analysis,
      overageEntries: [
        ["a.ts", { overageItems: [{ line: 1 }, { line: 2 }] }],
        ["b.ts", { overageItems: [{ line: 3 }] }],
      ],
      countBy: "entries",
      messages: ["entry overages"],
      overageDetail: "2 files exceed baseline",
      baselineDetail: "baseline ok",
    });

    expect(result.errors).toBe(2);
    expect(result.findings).toBe(2);
    expect(result.detail).toBe("2 files exceed baseline");
  });

  it("counts item-level overages by default", () => {
    const result = createCountRatchetResult({
      analysis,
      overageEntries: [["a.ts", { overageItems: [{ line: 1 }, { line: 2 }] }]],
      messages: ["item overages"],
      overageDetail: "2 overages",
      baselineDetail: "baseline ok",
    });

    expect(result.errors).toBe(2);
    expect(result.findings).toBe(2);
    expect(result.detail).toBe("2 overages");
  });

  it("supports audit ratchets", () => {
    const result = createCountRatchetResult({
      blocking: false,
      analysis,
      overageEntries: [["a.ts", { overageItems: [{ line: 1 }] }]],
      messages: ["informational overage"],
      overageDetail: "1 informational finding",
      baselineDetail: "baseline ok",
    });

    expect(result.passed).toBe(true);
    expect(result.errors).toBe(0);
    expect(result.findings).toBe(1);
    expect(result.showMessagesOnPass).toBe(true);
  });
});
