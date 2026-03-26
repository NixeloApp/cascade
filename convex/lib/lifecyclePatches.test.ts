import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import {
  buildArchivedStatePatch,
  buildArchivedStatePatchWithActor,
  buildCompletedEnrollmentPatch,
  buildIssueArchivePatch,
  buildIssueRestorePatch,
  buildRestoredArchiveStatePatch,
  buildRestoredArchiveStatePatchWithActor,
  buildTerminalEnrollmentPatch,
} from "./lifecyclePatches";

describe("lifecyclePatches", () => {
  it("builds issue archive fields with an actor when provided", () => {
    const userId = "user-1" as Id<"users">;
    const patch = buildIssueArchivePatch(123, userId);

    expect(patch).toEqual({
      archivedAt: 123,
      archivedBy: "user-1",
    });
  });

  it("builds issue restore fields", () => {
    expect(buildIssueRestorePatch()).toEqual({
      archivedAt: undefined,
      archivedBy: undefined,
    });
  });

  it("builds archivable state patches with and without an actor", () => {
    expect(buildArchivedStatePatch(123)).toEqual({
      isArchived: true,
      archivedAt: 123,
    });
    const userId = "user-1" as Id<"users">;
    expect(buildArchivedStatePatchWithActor(123, userId)).toEqual({
      isArchived: true,
      archivedAt: 123,
      archivedBy: "user-1",
    });
  });

  it("builds restored archive state fields", () => {
    expect(buildRestoredArchiveStatePatch()).toEqual({
      isArchived: undefined,
      archivedAt: undefined,
    });
    expect(buildRestoredArchiveStatePatchWithActor()).toEqual({
      isArchived: undefined,
      archivedAt: undefined,
      archivedBy: undefined,
    });
  });

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
