import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Typography } from "./Typography";

describe("Typography", () => {
  it("applies the projectHeaderTitle variant", () => {
    render(
      <Typography variant="projectHeaderTitle" data-testid="title">
        Project Alpha
      </Typography>,
    );
    const title = screen.getByTestId("title");
    expect(title.className).toContain("truncate");
    expect(title.className).toContain("text-sm");
    expect(title.className).toContain("sm:text-2xl");
    expect(title.className).toContain("tracking-tight");
  });

  it("maps wikiCardTitle to an h3 with truncation styles", () => {
    render(
      <Typography variant="wikiCardTitle" data-testid="wiki-title">
        Engineering Playbook
      </Typography>,
    );
    const title = screen.getByTestId("wiki-title");
    expect(title.tagName).toBe("H3");
    expect(title.className).toContain("line-clamp-1");
    expect(title.className).toContain("text-2xl");
  });

  it("maps placeholderTitle to a paragraph with shared spacing", () => {
    render(
      <Typography variant="placeholderTitle" data-testid="placeholder-title">
        Coming Soon
      </Typography>,
    );
    const title = screen.getByTestId("placeholder-title");
    expect(title.tagName).toBe("P");
    expect(title.className).toContain("mb-2");
    expect(title.className).toContain("text-lg");
  });

  it("maps sidebarOrgInitial to a span", () => {
    render(
      <Typography variant="sidebarOrgInitial" data-testid="initials">
        NX
      </Typography>,
    );
    expect(screen.getByTestId("initials").tagName).toBe("SPAN");
  });
});
