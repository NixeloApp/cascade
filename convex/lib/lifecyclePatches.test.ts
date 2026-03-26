import { describe, expect, it } from "vitest";
import { buildCompletedEnrollmentPatch, buildTerminalEnrollmentPatch } from "./lifecyclePatches";

describe("lifecyclePatches", () => {
  it("builds completed enrollment patches", () => {
    expect(buildCompletedEnrollmentPatch(456)).toEqual({
      status: "completed",
      completedAt: 456,
      nextSendAt: undefined,
    });
    expect(buildCompletedEnrollmentPatch(456, 3)).toEqual({
      currentStep: 3,
      status: "completed",
      completedAt: 456,
      nextSendAt: undefined,
    });
  });

  it("builds terminal enrollment patches", () => {
    expect(buildTerminalEnrollmentPatch("bounced", 789)).toEqual({
      status: "bounced",
      completedAt: 789,
      nextSendAt: undefined,
    });
    expect(buildTerminalEnrollmentPatch("replied", 789)).toEqual({
      status: "replied",
      completedAt: 789,
      nextSendAt: undefined,
      lastRepliedAt: 789,
    });
  });
});
