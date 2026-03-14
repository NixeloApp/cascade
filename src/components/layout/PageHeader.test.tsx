import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PageHeader } from "./PageHeader";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: ReactNode;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("PageHeader", () => {
  it("renders the title, description, and custom shell class", () => {
    const { container } = render(
      <PageHeader
        title="Workspace overview"
        description="Track work across teams."
        className="custom-shell"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Workspace overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Track work across teams.")).toBeInTheDocument();
    expect(screen.getByText("Workspace view")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "breadcrumb" })).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass("mb-4", "sm:mb-5", "custom-shell");
  });

  it("renders breadcrumbs and actions when provided", () => {
    render(
      <PageHeader
        title="Issue detail"
        breadcrumbs={[{ label: "Workspaces", to: "/workspaces" }, { label: "Platform" }]}
        actions={<button type="button">Create issue</button>}
      />,
    );

    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workspaces" })).toHaveAttribute("href", "/workspaces");
    expect(screen.getByText("Platform")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Create issue" })).toBeInTheDocument();
  });
});
