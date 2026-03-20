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

  it("maps sidebarOrgInitial to a span", () => {
    render(
      <Typography variant="sidebarOrgInitial" data-testid="initials">
        NX
      </Typography>,
    );
    expect(screen.getByTestId("initials").tagName).toBe("SPAN");
  });
});
