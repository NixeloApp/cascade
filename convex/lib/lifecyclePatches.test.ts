import { describe, expect, it } from "vitest";
import { buildCompletedEnrollmentPatch, buildTerminalEnrollmentPatch } from "./lifecyclePatches";

const COMPLETED_AT = 456;
const TERMINAL_AT = 789;
const CURRENT_STEP = 3;

describe("lifecyclePatches", () => {
  it("builds completed enrollment patches", () => {
    expect(buildCompletedEnrollmentPatch(COMPLETED_AT)).toEqual({
      status: "completed",
      completedAt: COMPLETED_AT,
      nextSendAt: undefined,
    });
    expect(buildCompletedEnrollmentPatch(COMPLETED_AT, CURRENT_STEP)).toEqual({
      currentStep: CURRENT_STEP,
      status: "completed",
      completedAt: COMPLETED_AT,
      nextSendAt: undefined,
    });
  });

  it("builds terminal enrollment patches", () => {
    expect(buildTerminalEnrollmentPatch("bounced", TERMINAL_AT)).toEqual({
      status: "bounced",
      completedAt: TERMINAL_AT,
      nextSendAt: undefined,
      lastRepliedAt: undefined,
    });
    expect(buildTerminalEnrollmentPatch("replied", TERMINAL_AT)).toEqual({
      status: "replied",
      completedAt: TERMINAL_AT,
      nextSendAt: undefined,
      lastRepliedAt: TERMINAL_AT,
    });
  });
});
