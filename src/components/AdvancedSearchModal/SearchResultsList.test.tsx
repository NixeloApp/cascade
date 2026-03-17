import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { SearchResultsList } from "./SearchResultsList";

describe("SearchResultsList", () => {
  it("renders an empty state when no results match", () => {
    render(
      <SearchResultsList
        searchQuery="bug"
        results={[]}
        total={0}
        hasMore={false}
        onSelectIssue={vi.fn()}
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("No matching issues")).toBeInTheDocument();
    expect(screen.getByText(/try a broader query or clear one of the filters/i)).toBeVisible();
  });

  it("calls onSelectIssue when a result row is activated", async () => {
    const onSelectIssue = vi.fn();

    render(
      <SearchResultsList
        searchQuery="bug"
        results={[
          {
            _id: "issue-1" as Id<"issues">,
            key: "PROJ-123",
            title: "Fix hover regression",
            type: "bug",
            priority: "high",
            projectId: "project-1" as Id<"projects">,
          },
        ]}
        total={1}
        hasMore={false}
        onSelectIssue={onSelectIssue}
        onLoadMore={vi.fn()}
      />,
    );

    await screen.getByRole("button", { name: /proj-123 fix hover regression/i }).click();

    expect(onSelectIssue).toHaveBeenCalledWith("PROJ-123");
  });
});
