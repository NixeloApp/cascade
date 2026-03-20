import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { List } from "./List";

describe("List", () => {
  it("renders an unordered list by default", () => {
    render(<List data-testid="list">Content</List>);

    const list = screen.getByTestId("list");
    expect(list.tagName).toBe("UL");
    expect(list).toHaveClass("list-none");
  });

  it("renders an ordered list when requested", () => {
    render(
      <List as="ol" data-testid="list">
        Content
      </List>,
    );

    expect(screen.getByTestId("list").tagName).toBe("OL");
  });

  it("renders the branded bullet variant", () => {
    render(
      <List variant="bulleted" data-testid="list">
        Content
      </List>,
    );

    expect(screen.getByTestId("list")).toHaveClass(
      "list-disc",
      "list-inside",
      "text-ui-text-secondary",
      "marker:text-brand",
    );
  });
});
