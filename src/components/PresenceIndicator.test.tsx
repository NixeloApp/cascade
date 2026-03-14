import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PresenceIndicator } from "./PresenceIndicator";

const { mockUsePresence } = vi.hoisted(() => ({
  mockUsePresence: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    presence: "presence",
  },
}));

vi.mock("@convex-dev/presence/react", () => ({
  default: mockUsePresence,
}));

vi.mock("@convex-dev/presence/facepile", () => ({
  default: ({ presenceState }: { presenceState: readonly unknown[] }) => (
    <div data-testid="facepile">{presenceState.length} collaborators</div>
  ),
}));

describe("PresenceIndicator", () => {
  it("renders nothing when no presence state is available", () => {
    mockUsePresence.mockReturnValue(null);

    const { container } = render(<PresenceIndicator roomId="room-1" userId="user-1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the presence count and facepile when collaborators are active", () => {
    mockUsePresence.mockReturnValue([{ id: "u1" }, { id: "u2" }]);

    render(<PresenceIndicator roomId="room-1" userId="user-1" />);

    expect(screen.getByText("2 people editing")).toBeInTheDocument();
    expect(screen.getByTestId("facepile")).toHaveTextContent("2 collaborators");
  });

  it("uses singular copy when exactly one collaborator is active", () => {
    mockUsePresence.mockReturnValue([{ id: "u1" }]);

    render(<PresenceIndicator roomId="room-1" userId="user-1" />);

    expect(screen.getByText("1 person editing")).toBeInTheDocument();
  });
});
