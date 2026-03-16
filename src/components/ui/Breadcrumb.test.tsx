import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import { BreadcrumbLink } from "./Breadcrumb";

const testHref = ROUTES.workspaces.list.path.replace("/$orgSlug", "");

describe("BreadcrumbLink", () => {
  it("renders a plain anchor by default", () => {
    render(<BreadcrumbLink href={testHref}>Workspaces</BreadcrumbLink>);

    expect(screen.getByRole("link", { name: "Workspaces" })).toHaveAttribute("href", testHref);
  });

  it("reuses the child anchor when asChild is true", () => {
    const { container } = render(
      <BreadcrumbLink asChild>
        <a href={testHref}>Workspaces</a>
      </BreadcrumbLink>,
    );

    expect(screen.getByRole("link", { name: "Workspaces" })).toHaveAttribute("href", testHref);
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });
});
