import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BreadcrumbLink } from "./Breadcrumb";

describe("BreadcrumbLink", () => {
  it("renders a plain anchor by default", () => {
    render(<BreadcrumbLink href="/workspaces">Workspaces</BreadcrumbLink>);

    expect(screen.getByRole("link", { name: "Workspaces" })).toHaveAttribute("href", "/workspaces");
  });

  it("reuses the child anchor when asChild is true", () => {
    const { container } = render(
      <BreadcrumbLink asChild>
        <a href="/workspaces">Workspaces</a>
      </BreadcrumbLink>,
    );

    expect(screen.getByRole("link", { name: "Workspaces" })).toHaveAttribute("href", "/workspaces");
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });
});
