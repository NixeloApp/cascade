import { describe, expect, it } from "vitest";
import {
  calculateFetchBuffer,
  clampLimit,
  clampOffset,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_PAGE_SIZE,
  FETCH_BUFFER_MULTIPLIER,
  MAX_ACTIVITY_FOR_ANALYTICS,
  MAX_ACTIVITY_ITEMS,
  MAX_AI_CONTEXT_ITEMS,
  MAX_API_KEY_USAGE_RECORDS,
  MAX_COMPLIANCE_RECORDS,
  MAX_LABELS_PER_PROJECT,
  MAX_OFFSET,
  MAX_ORG_MEMBERS,
  MAX_PAGE_SIZE,
  MAX_PROJECTS_PER_TEAM,
  MAX_SEARCH_CONTEXT_ITEMS,
  MAX_SPRINT_ISSUES,
  MAX_TEAM_MEMBERS,
  MAX_TEAMS_PER_ORG,
  MAX_USER_ASSIGNED_ISSUES,
  MAX_VELOCITY_SPRINTS,
} from "./queryLimits";

describe("query limits", () => {
  describe("pagination constants", () => {
    it("should have correct default page size", () => {
      expect(DEFAULT_PAGE_SIZE).toBe(50);
    });

    it("should have correct default search page size", () => {
      expect(DEFAULT_SEARCH_PAGE_SIZE).toBe(20);
    });

    it("should have correct max page size", () => {
      expect(MAX_PAGE_SIZE).toBe(100);
    });

    it("should have correct max offset", () => {
      expect(MAX_OFFSET).toBe(1000);
    });

    it("should have correct fetch buffer multiplier", () => {
      expect(FETCH_BUFFER_MULTIPLIER).toBe(3);
    });
  });

  describe("activity and feed limits", () => {
    it("should have correct activity limits", () => {
      expect(MAX_ACTIVITY_ITEMS).toBe(100);
      expect(MAX_ACTIVITY_FOR_ANALYTICS).toBe(1000);
    });
  });

  describe("context limits", () => {
    it("should have correct AI context items", () => {
      expect(MAX_AI_CONTEXT_ITEMS).toBe(100);
    });

    it("should have correct search context items", () => {
      expect(MAX_SEARCH_CONTEXT_ITEMS).toBe(20);
    });
  });

  describe("feature-specific limits", () => {
    it("should have correct velocity sprints limit", () => {
      expect(MAX_VELOCITY_SPRINTS).toBe(10);
    });

    it("should have correct sprint issues limit", () => {
      expect(MAX_SPRINT_ISSUES).toBe(1000);
    });

    it("should have correct API key usage records limit", () => {
      expect(MAX_API_KEY_USAGE_RECORDS).toBe(100);
    });

    it("should have correct compliance records limit", () => {
      expect(MAX_COMPLIANCE_RECORDS).toBe(1000);
    });

    it("should have correct team members limit", () => {
      expect(MAX_TEAM_MEMBERS).toBe(500);
    });

    it("should have correct teams per org limit", () => {
      expect(MAX_TEAMS_PER_ORG).toBe(200);
    });

    it("should have correct projects per team limit", () => {
      expect(MAX_PROJECTS_PER_TEAM).toBe(200);
    });

    it("should have correct labels per project limit", () => {
      expect(MAX_LABELS_PER_PROJECT).toBe(200);
    });

    it("should have correct org members limit", () => {
      expect(MAX_ORG_MEMBERS).toBe(1000);
    });

    it("should have correct user assigned issues limit", () => {
      expect(MAX_USER_ASSIGNED_ISSUES).toBe(500);
    });
  });

  describe("clampLimit", () => {
    it("should return default when undefined", () => {
      expect(clampLimit(undefined)).toBe(DEFAULT_PAGE_SIZE);
    });

    it("should return custom default when provided", () => {
      expect(clampLimit(undefined, 25)).toBe(25);
    });

    it("should return requested value when within range", () => {
      expect(clampLimit(30)).toBe(30);
      expect(clampLimit(50)).toBe(50);
    });

    it("should clamp to MAX_PAGE_SIZE when exceeding", () => {
      expect(clampLimit(150)).toBe(MAX_PAGE_SIZE);
      expect(clampLimit(1000)).toBe(MAX_PAGE_SIZE);
    });

    it("should clamp negative values to 0", () => {
      expect(clampLimit(-10)).toBe(0);
      expect(clampLimit(-1)).toBe(0);
    });

    it("should floor decimal values", () => {
      expect(clampLimit(25.9)).toBe(25);
      expect(clampLimit(50.1)).toBe(50);
    });
  });

  describe("clampOffset", () => {
    it("should return 0 when undefined", () => {
      expect(clampOffset(undefined)).toBe(0);
    });

    it("should return requested value when within range", () => {
      expect(clampOffset(100)).toBe(100);
      expect(clampOffset(500)).toBe(500);
    });

    it("should clamp to MAX_OFFSET when exceeding", () => {
      expect(clampOffset(1500)).toBe(MAX_OFFSET);
      expect(clampOffset(5000)).toBe(MAX_OFFSET);
    });

    it("should clamp negative values to 0", () => {
      expect(clampOffset(-10)).toBe(0);
      expect(clampOffset(-1)).toBe(0);
    });

    it("should floor decimal values", () => {
      expect(clampOffset(100.9)).toBe(100);
      expect(clampOffset(500.1)).toBe(500);
    });
  });

  describe("calculateFetchBuffer", () => {
    it("should calculate buffer with default offset", () => {
      expect(calculateFetchBuffer(50)).toBe(50 * FETCH_BUFFER_MULTIPLIER);
      expect(calculateFetchBuffer(20)).toBe(20 * FETCH_BUFFER_MULTIPLIER);
    });

    it("should include offset in calculation", () => {
      expect(calculateFetchBuffer(50, 100)).toBe((100 + 50) * FETCH_BUFFER_MULTIPLIER);
    });

    it("should handle zero limit", () => {
      expect(calculateFetchBuffer(0)).toBe(0);
      expect(calculateFetchBuffer(0, 50)).toBe(50 * FETCH_BUFFER_MULTIPLIER);
    });

    it("should handle negative values by treating them as 0", () => {
      expect(calculateFetchBuffer(-10)).toBe(0);
      expect(calculateFetchBuffer(-10, -20)).toBe(0);
    });

    it("should floor decimal values", () => {
      expect(calculateFetchBuffer(10.9, 5.1)).toBe((10 + 5) * FETCH_BUFFER_MULTIPLIER);
    });
  });
});
