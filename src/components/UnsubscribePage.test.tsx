import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { UnsubscribePage } from "./UnsubscribePage";

// Mock TanStack Router (required for AuthPageLayout's Link)
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

describe("UnsubscribePage", () => {
  const mockToken = "valid-token-123";
  const mockUser = { _id: "user-1", name: "Test User", email: "test@example.com" };
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mutation mocks
    vi.mocked(useMutation).mockImplementation(() => {
      return mockUnsubscribe as any;
    });

    // Default mock for useQuery (loading state)
    vi.mocked(useQuery).mockImplementation(() => {
      return undefined as any;
    });
  });

  it("renders loading state initially", () => {
    render(<UnsubscribePage token={mockToken} />);

    expect(screen.getByText("Unsubscribing...")).toBeInTheDocument();
    expect(screen.getByText("Processing your request")).toBeInTheDocument();
  });

  it("renders success state when unsubscribe is successful", async () => {
    vi.mocked(useQuery).mockReturnValue(mockUser);
    mockUnsubscribe.mockResolvedValue(undefined);

    render(<UnsubscribePage token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText("Unsubscribed")).toBeInTheDocument();
      expect(
        screen.getByText("You've been unsubscribed from email notifications."),
      ).toBeInTheDocument();
    });
  });

  it("renders invalid state when token is invalid", async () => {
    vi.mocked(useQuery).mockReturnValue(null);

    render(<UnsubscribePage token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText("Invalid link")).toBeInTheDocument();
      expect(
        screen.getByText("This unsubscribe link is invalid or has expired."),
      ).toBeInTheDocument();
    });
  });

  it("renders error state when unsubscribe fails", async () => {
    vi.mocked(useQuery).mockReturnValue(mockUser);
    mockUnsubscribe.mockRejectedValue(new Error("Network error"));

    render(<UnsubscribePage token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("We couldn't process your unsubscribe request.")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
