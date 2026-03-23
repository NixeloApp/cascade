import { DAY, HOUR } from "@convex/lib/timeUtils";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { ClientCard, PortalTokenDetails } from "./ClientCard";

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

const MOCK_TOKENS = [
  {
    _id: "token1" as never,
    isRevoked: false,
    updatedAt: Date.now(),
    lastAccessedAt: Date.now() - HOUR,
    expiresAt: Date.now() + DAY,
  },
  {
    _id: "token2" as never,
    isRevoked: true,
    updatedAt: Date.now() - DAY,
  },
];

const noop = vi.fn();

describe("ClientCard", () => {
  it("renders client details", () => {
    render(
      <ClientCard
        client={MOCK_CLIENT}
        onGeneratePortalLink={noop}
        onRefreshPortalTokens={noop}
        onRevokePortalToken={noop}
        portalTokens={[]}
        projects={MOCK_PROJECTS}
      />,
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("billing@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Acme Industries")).toBeInTheDocument();
    expect(screen.getByText("Default rate: $150.00")).toBeInTheDocument();
  });

  it("renders without company", () => {
    const clientNoCompany = { ...MOCK_CLIENT, company: undefined };
    render(
      <ClientCard
        client={clientNoCompany}
        onGeneratePortalLink={noop}
        onRefreshPortalTokens={noop}
        onRevokePortalToken={noop}
        portalTokens={[]}
        projects={MOCK_PROJECTS}
      />,
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Acme Industries")).not.toBeInTheDocument();
  });

  it("shows portal link when generated", () => {
    render(
      <ClientCard
        client={MOCK_CLIENT}
        generatedPortalLink="/portal/abc123"
        onGeneratePortalLink={noop}
        onRefreshPortalTokens={noop}
        onRevokePortalToken={noop}
        portalTokens={[]}
        projects={MOCK_PROJECTS}
      />,
    );

    expect(screen.getByText("/portal/abc123")).toBeInTheDocument();
  });

  it("shows project selector when multiple projects exist", () => {
    render(
      <ClientCard
        client={MOCK_CLIENT}
        onGeneratePortalLink={noop}
        onRefreshPortalTokens={noop}
        onRevokePortalToken={noop}
        portalTokens={[]}
        projects={MOCK_PROJECTS}
      />,
    );

    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
  });

  it("hides project selector with single project", () => {
    render(
      <ClientCard
        client={MOCK_CLIENT}
        onGeneratePortalLink={noop}
        onRefreshPortalTokens={noop}
        onRevokePortalToken={noop}
        portalTokens={[]}
        projects={[MOCK_PROJECTS[0]]}
      />,
    );

    expect(screen.queryByText("Select project")).not.toBeInTheDocument();
  });
});

describe("PortalTokenDetails", () => {
  it("renders active and revoked tokens", () => {
    render(
      <PortalTokenDetails
        clientId={"client1" as never}
        onRevokePortalToken={noop}
        tokens={MOCK_TOKENS}
      />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Revoked")).toBeInTheDocument();
  });

  it("shows revoke button only for active tokens", () => {
    render(
      <PortalTokenDetails
        clientId={"client1" as never}
        onRevokePortalToken={noop}
        tokens={MOCK_TOKENS}
      />,
    );

    const revokeButtons = screen.getAllByRole("button", { name: /revoke token/i });
    expect(revokeButtons).toHaveLength(1);
  });

  it("renders empty when no tokens", () => {
    const { container } = render(
      <PortalTokenDetails clientId={"client1" as never} onRevokePortalToken={noop} tokens={[]} />,
    );

    expect(container.innerHTML).toBe("");
  });
});
