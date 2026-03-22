import { describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { render, screen } from "@/test/custom-render";
import { Stickies } from "./Stickies";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

describe("Stickies", () => {
  it("renders empty state when no stickies exist", () => {
    vi.mocked(useOrganization).mockReturnValue({
      organizationId: "org_1" as never,
      orgSlug: "test-org",
      organizationName: "Test Org",
      userRole: "admin",
      billingEnabled: false,
    });
    vi.mocked(useAuthenticatedQuery).mockReturnValue([]);
    vi.mocked(useAuthenticatedMutation).mockReturnValue({
      mutate: vi.fn() as never,
      canAct: true,
      isAuthLoading: false,
    });

    render(<Stickies />);

    expect(screen.getByText("No quick notes")).toBeInTheDocument();
    expect(screen.getByText("Capture thoughts, reminders, and ideas.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /add note/i }).length).toBeGreaterThan(0);
  });
});
