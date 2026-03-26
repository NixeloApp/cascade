import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { RouteNav, RouteNavItem } from "./RouteNav";

describe("RouteNav", () => {
  it("uses aria-current without emitting a raw data-active attribute", () => {
    render(
      <RouteNav aria-label="Sections">
        <RouteNavItem active>Overview</RouteNavItem>
      </RouteNav>,
    );

    const item = screen.getByRole("button", { name: "Overview" });
    expect(item).toHaveAttribute("aria-current", "page");
    expect(item).not.toHaveAttribute("data-active");
  });

  it("preserves active aria-current when rendered as a child link", () => {
    render(
      <RouteNav aria-label="Sections">
        <RouteNavItem asChild active>
          <a href="/docs">Docs</a>
        </RouteNavItem>
      </RouteNav>,
    );

    const item = screen.getByRole("link", { name: "Docs" });
    expect(item).toHaveAttribute("aria-current", "page");
    expect(item).not.toHaveAttribute("data-active");
  });

  it("supports wrapping navigation items on mobile while preserving desktop scrolling", () => {
    render(
      <RouteNav aria-label="Sections" mobileLayout="wrap" size="sm">
        <RouteNavItem>Teams</RouteNavItem>
        <RouteNavItem>Backlog</RouteNavItem>
        <RouteNavItem>Dependencies</RouteNavItem>
      </RouteNav>,
    );

    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav).toHaveClass(
      "flex-wrap",
      "overflow-visible",
      "sm:flex-nowrap",
      "sm:overflow-x-auto",
    );
  });
});
