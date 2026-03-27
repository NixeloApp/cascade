import { describe, expect, it } from "vitest";
import type { SeedScreenshotResult } from "../utils/test-user-service";
import {
  getPrimarySeededDocumentId,
  getSeededIssueKey,
  getSeededTeamSlug,
  requirePrimarySeededDocumentId,
  requireSeededIssueKey,
  requireSeededTeamSlug,
} from "./helpers";

describe("screenshot seeded helpers", () => {
  it("prefers the first seeded issue key", () => {
    const seed: SeedScreenshotResult = {
      success: true,
      issueKeys: ["DEMO-1", "DEMO-2"],
    };

    expect(getSeededIssueKey(seed)).toBe("DEMO-1");
    expect(requireSeededIssueKey(seed, "issue detail capture")).toBe("DEMO-1");
  });

  it("prefers sprint retrospective notes as the primary document id", () => {
    const seed: SeedScreenshotResult = {
      success: true,
      documentIds: {
        projectRequirements: "doc-project",
        sprintRetrospectiveNotes: "doc-retro",
      },
    };

    expect(getPrimarySeededDocumentId(seed)).toBe("doc-retro");
    expect(requirePrimarySeededDocumentId(seed, "document editor capture")).toBe("doc-retro");
  });

  it("falls back to project requirements when only one seeded document exists", () => {
    const seed: SeedScreenshotResult = {
      success: true,
      documentIds: {
        projectRequirements: "doc-project",
      },
    };

    expect(getPrimarySeededDocumentId(seed)).toBe("doc-project");
  });

  it("returns and requires the seeded team slug", () => {
    const seed: SeedScreenshotResult = {
      success: true,
      teamSlug: "engineering",
    };

    expect(getSeededTeamSlug(seed)).toBe("engineering");
    expect(requireSeededTeamSlug(seed, "team page captures")).toBe("engineering");
  });

  it("throws clear errors when required seeded data is missing", () => {
    const seed: SeedScreenshotResult = { success: true };

    expect(() => requireSeededIssueKey(seed, "issue detail capture")).toThrow(
      "Missing seeded issue key for issue detail capture",
    );
    expect(() => requirePrimarySeededDocumentId(seed, "document editor capture")).toThrow(
      "Missing seeded document id for document editor capture",
    );
    expect(() => requireSeededTeamSlug(seed, "team page captures")).toThrow(
      "Missing seeded team slug for team page captures",
    );
  });
});
