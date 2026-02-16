import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { PresenceIndicator } from "./PresenceIndicator";

// Mock the presence library
vi.mock("@convex-dev/presence/react", () => ({
  default: vi.fn(),
}));

vi.mock("@convex-dev/presence/facepile", () => ({
  default: ({ presenceState }: { presenceState: unknown[] }) => (
    <div data-testid="facepile">
      {presenceState.map((_, i) => (
        <div key={i} data-testid="facepile-avatar" />
      ))}
    </div>
  ),
}));

import usePresence from "@convex-dev/presence/react";

const mockUsePresence = vi.mocked(usePresence);

describe("PresenceIndicator", () => {
  const defaultProps = {
    roomId: "room-123",
    userId: "user-456",
  };

  describe("when presence state is null", () => {
    it("should render nothing", () => {
      mockUsePresence.mockReturnValue(null);

      const { container } = render(<PresenceIndicator {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("when presence state is empty", () => {
    it("should render with 0 people", () => {
      mockUsePresence.mockReturnValue([]);

      render(<PresenceIndicator {...defaultProps} />);

      expect(screen.getByText("0 people editing")).toBeInTheDocument();
    });
  });

  describe("when one person is present", () => {
    it("should show singular 'person' text", () => {
      mockUsePresence.mockReturnValue([
        { oderId: "user-1", name: "Alice", image: "https://example.com/alice.jpg" },
      ]);

      render(<PresenceIndicator {...defaultProps} />);

      expect(screen.getByText("1 person editing")).toBeInTheDocument();
    });

    it("should render FacePile with one avatar", () => {
      mockUsePresence.mockReturnValue([
        { oderId: "user-1", name: "Alice", image: "https://example.com/alice.jpg" },
      ]);

      render(<PresenceIndicator {...defaultProps} />);

      expect(screen.getAllByTestId("facepile-avatar")).toHaveLength(1);
    });
  });

  describe("when multiple people are present", () => {
    it("should show plural 'people' text for 2 people", () => {
      mockUsePresence.mockReturnValue([
        { oderId: "user-1", name: "Alice", image: "https://example.com/alice.jpg" },
        { oderId: "user-2", name: "Bob", image: "https://example.com/bob.jpg" },
      ]);

      render(<PresenceIndicator {...defaultProps} />);

      expect(screen.getByText("2 people editing")).toBeInTheDocument();
    });

    it("should show plural 'people' text for many people", () => {
      mockUsePresence.mockReturnValue([
        { oderId: "user-1", name: "Alice", image: "https://example.com/alice.jpg" },
        { oderId: "user-2", name: "Bob", image: "https://example.com/bob.jpg" },
        { oderId: "user-3", name: "Charlie", image: "https://example.com/charlie.jpg" },
        { oderId: "user-4", name: "Diana", image: "https://example.com/diana.jpg" },
        { oderId: "user-5", name: "Eve", image: "https://example.com/eve.jpg" },
      ]);

      render(<PresenceIndicator {...defaultProps} />);

      expect(screen.getByText("5 people editing")).toBeInTheDocument();
    });

    it("should render FacePile with correct number of avatars", () => {
      mockUsePresence.mockReturnValue([
        { oderId: "user-1", name: "Alice", image: "https://example.com/alice.jpg" },
        { oderId: "user-2", name: "Bob", image: "https://example.com/bob.jpg" },
        { oderId: "user-3", name: "Charlie", image: "https://example.com/charlie.jpg" },
      ]);

      render(<PresenceIndicator {...defaultProps} />);

      expect(screen.getAllByTestId("facepile-avatar")).toHaveLength(3);
    });
  });

  describe("hook integration", () => {
    it("should pass roomId and userId to usePresence", () => {
      mockUsePresence.mockReturnValue([]);

      render(<PresenceIndicator roomId="doc-abc" userId="user-xyz" />);

      expect(mockUsePresence).toHaveBeenCalledWith(
        expect.anything(), // api.presence
        "doc-abc",
        "user-xyz",
      );
    });
  });
});
