import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ClientCard } from "./ClientCard";

vi.mock("@convex/_generated/api", () => ({
  api: {
    clientPortal: {
      listTokensByClientReactive: "clientPortal:listTokensByClientReactive",
      generateToken: "clientPortal:generateToken",
      revokeToken: "clientPortal:revokeToken",
    },
  },
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(() => []),
  useAuthenticatedMutation: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(() => ({
    organizationId: "org1" as never,
    orgSlug: "acme",
    organizationName: "Acme",
    userRole: "owner",
    billingEnabled: true,
  })),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const MOCK_CLIENT = {
  _id: "client1" as never,
  _creationTime: Date.now(),
  organizationId: "org1" as never,
  name: "Acme Corp",
  email: "billing@acme.com",
  company: "Acme Industries",
  hourlyRate: 150,
  updatedAt: Date.now(),
  createdBy: "user1" as never,
};

const MOCK_PROJECTS = [
  { _id: "proj1", name: "Website Redesign" },
  { _id: "proj2", name: "Mobile App" },
];

describe("ClientCard", () => {
  it("renders client details", () => {
    render(<ClientCard client={MOCK_CLIENT} projects={MOCK_PROJECTS} />);

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("billing@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Acme Industries")).toBeInTheDocument();
    expect(screen.getByText("Default rate: $150.00")).toBeInTheDocument();
  });

  it("renders without company", () => {
    const clientNoCompany = { ...MOCK_CLIENT, company: undefined };
    render(<ClientCard client={clientNoCompany} projects={MOCK_PROJECTS} />);

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Acme Industries")).not.toBeInTheDocument();
  });

  it("shows project selector when multiple projects exist", () => {
    render(<ClientCard client={MOCK_CLIENT} projects={MOCK_PROJECTS} />);

    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
  });

  it("hides project selector with single project", () => {
    render(<ClientCard client={MOCK_CLIENT} projects={[MOCK_PROJECTS[0]]} />);

    expect(screen.queryByText("Select project")).not.toBeInTheDocument();
  });

  it("shows generate portal link button", () => {
    render(<ClientCard client={MOCK_CLIENT} projects={MOCK_PROJECTS} />);

    expect(screen.getByRole("button", { name: /generate portal link/i })).toBeInTheDocument();
  });

  it("renders with zero hourly rate", () => {
    const clientNoRate = { ...MOCK_CLIENT, hourlyRate: undefined };
    render(<ClientCard client={clientNoRate} projects={MOCK_PROJECTS} />);

    expect(screen.getByText("Default rate: $0.00")).toBeInTheDocument();
  });
});
