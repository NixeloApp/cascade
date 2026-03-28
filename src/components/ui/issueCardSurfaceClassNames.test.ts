import { describe, expect, it } from "vitest";
import {
  getIssueCardAssigneeFallbackClassName,
  getIssueCardDragHandleIconClassName,
  getIssueCardHeaderClassName,
  getIssueCardLabelsClassName,
  getIssueCardRootClassName,
  getIssueCardTitleClassName,
} from "./issueCardSurfaceClassNames";

describe("issueCardSurfaceClassNames", () => {
  it("builds the base issue-card shell and drag state classes", () => {
    const classes = getIssueCardRootClassName({ isDragging: true });

    expect(classes).toContain("group");
    expect(classes).toContain("w-full");
    expect(classes).toContain("opacity-50");
    expect(classes).toContain("scale-95");
  });

  it("builds the drop-edge indicators for the top and bottom states", () => {
    expect(getIssueCardRootClassName({ closestEdge: "top" })).toContain("before:absolute");
    expect(getIssueCardRootClassName({ closestEdge: "bottom" })).toContain("after:absolute");
  });

  it("keeps the issue-card spacing helpers centralized", () => {
    expect(getIssueCardHeaderClassName()).toContain("mb-1");
    expect(getIssueCardLabelsClassName()).toContain("mb-1.5");
    expect(getIssueCardTitleClassName()).toContain("line-clamp-2");
  });

  it("builds the assignee fallback avatar surface", () => {
    const classes = getIssueCardAssigneeFallbackClassName();

    expect(classes).toContain("size-5");
    expect(classes).toContain("text-xs");
    expect(classes).toContain("font-medium");
  });

  it("builds the drag-handle icon chrome", () => {
    const classes = getIssueCardDragHandleIconClassName();

    expect(classes).toContain("size-3");
    expect(classes).toContain("-ml-0.5");
    expect(classes).toContain("opacity-40");
  });
});
