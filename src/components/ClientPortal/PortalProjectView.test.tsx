import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PortalProjectView } from "./PortalProjectView";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
  }: {
    to: string;
    params: Record<string, string>;
    children: ReactNode;
  }) => (
    <a
      href={`${to}?token=${params.token}&projectId=${params.projectId}`}
      data-to={to}
      data-token={params.token}
      data-project-id={params.projectId}
    >
      {children}
    </a>
  ),
}));

describe("PortalProjectView", () => {
  it("renders the project metadata and links to the portal project route", () => {
    render(
      <PortalProjectView
        token="client-token"
        project={{
          _id: "project_123",
          name: "Q2 Client Rollout",
          key: "Q2R",
        }}
      />,
    );

    expect(screen.getByText("Q2 Client Rollout")).toBeInTheDocument();
    expect(screen.getByText("Project key: Q2R")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Open project view" });
    expect(link).toHaveAttribute("data-to", "/portal/$token/projects/$projectId");
    expect(link).toHaveAttribute("data-token", "client-token");
    expect(link).toHaveAttribute("data-project-id", "project_123");
  });
});
