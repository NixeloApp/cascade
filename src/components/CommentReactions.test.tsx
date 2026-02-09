import type { Id } from "@convex/_generated/dataModel";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/custom-render";
import { CommentReactions } from "./CommentReactions";

// Mock convex/react
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
}));

describe("CommentReactions", () => {
  const mockReactions = [
    { emoji: "👍", userIds: ["user1" as Id<"users">] },
    { emoji: "❤️", userIds: ["user1" as Id<"users">, "user2" as Id<"users">] },
  ];
  const currentUserId = "user1" as Id<"users">;
  const commentId = "comment1" as Id<"issueComments">;

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders reactions with accessible labels", () => {
    render(
      <CommentReactions
        commentId={commentId}
        reactions={mockReactions}
        currentUserId={currentUserId}
      />,
    );

    // Check for "Add reaction" button (Smile icon)
    const addBtn = screen.getByRole("button", { name: "Add reaction" });
    expect(addBtn).toBeInTheDocument();

    // Check for existing reactions
    // 👍: user1 has reacted.
    const thumbsUp = screen.getByRole("button", { name: "👍 reaction, 1 vote" });
    expect(thumbsUp).toBeInTheDocument();
    expect(thumbsUp).toHaveAttribute("aria-pressed", "true");

    // ❤️: user1 has reacted.
    const heart = screen.getByRole("button", { name: "❤️ reaction, 2 votes" });
    expect(heart).toBeInTheDocument();
    expect(heart).toHaveAttribute("aria-pressed", "true");
  });

  it("shows tooltips on hover", async () => {
    const user = userEvent.setup();
    render(
      <CommentReactions
        commentId={commentId}
        reactions={mockReactions}
        currentUserId={currentUserId}
      />,
    );

    // Hover over thumbs up (already reacted) -> should show "Remove reaction"
    const thumbsUp = screen.getByRole("button", { name: "👍 reaction, 1 vote" });
    await user.hover(thumbsUp);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Remove reaction");

    // Hover over add button -> should show "Add reaction"
    const addBtn = screen.getByRole("button", { name: "Add reaction" });
    await user.hover(addBtn);
    // Note: Tooltip might need time to appear or cleanup previous one.
    // Since we use userEvent, it simulates real interactions.
    // However, finding by role tooltip can be tricky if multiple exist.
    // But logically only one should be open at a time.
    // Let's just check the first one or ensure text content.
  });
});
