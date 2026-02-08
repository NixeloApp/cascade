import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { CommentRenderer } from "./CommentRenderer";

describe("CommentRenderer", () => {
  describe("Plain Text Rendering", () => {
    it("should render plain text without mentions", () => {
      render(<CommentRenderer content="This is a simple comment" />);

      expect(screen.getByText("This is a simple comment")).toBeInTheDocument();
    });

    it("should render empty string", () => {
      const { container } = render(<CommentRenderer content="" />);

      expect(container.textContent).toBe("");
    });

    it("should preserve whitespace and line breaks", () => {
      const content = "Line 1\nLine 2\n\nLine 4";
      const { container } = render(<CommentRenderer content={content} />);

      expect(container.textContent).toBe(content);
    });

    it("should handle special characters", () => {
      const specialChars = "Special chars: <>&\"'";
      render(<CommentRenderer content={specialChars} />);

      expect(screen.getByText(specialChars)).toBeInTheDocument();
    });

    it("should handle very long text", () => {
      const longText = "A".repeat(1000);
      render(<CommentRenderer content={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe("Mention Rendering", () => {
    it("should render a single mention", () => {
      const content = "Hello @[John Doe](user-123)!";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("@John Doe")).toBeInTheDocument();
      expect(screen.getByText("!")).toBeInTheDocument();
    });

    it("should render multiple mentions", () => {
      const content = "@[Alice](user-1) and @[Bob](user-2) are working on this";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@Alice")).toBeInTheDocument();
      expect(screen.getByText("@Bob")).toBeInTheDocument();
      expect(screen.getByText("and")).toBeInTheDocument();
      expect(screen.getByText("are working on this")).toBeInTheDocument();
    });

    it("should render mention at the beginning", () => {
      const content = "@[User](user-1) mentioned this";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@User")).toBeInTheDocument();
      expect(screen.getByText("mentioned this")).toBeInTheDocument();
    });

    it("should render mention at the end", () => {
      const content = "Thanks @[Helper](user-1)";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("Thanks")).toBeInTheDocument();
      expect(screen.getByText("@Helper")).toBeInTheDocument();
    });

    it("should render only mentions without surrounding text", () => {
      const content = "@[User1](user-1)@[User2](user-2)";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@User1")).toBeInTheDocument();
      expect(screen.getByText("@User2")).toBeInTheDocument();
    });

    it("should handle mentions with spaces in names", () => {
      const content = "@[John Michael Smith](user-1) commented";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@John Michael Smith")).toBeInTheDocument();
    });

    it("should handle mentions with special characters in names", () => {
      const content = "@[O'Brien-Smith](user-1) replied";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@O'Brien-Smith")).toBeInTheDocument();
    });
  });

  describe("MentionBadge", () => {
    it("should render mention badge with correct styling", () => {
      const content = "Hello @[User](user-123)";
      render(<CommentRenderer content={content} />);

      const badge = screen.getByText("@User");
      expect(badge).toHaveClass("bg-brand-subtle");
      expect(badge).toHaveClass("text-brand-active");
    });

    it("should have title attribute with @username", () => {
      const content = "@[TestUser](user-1) said hello";
      render(<CommentRenderer content={content} />);

      const badge = screen.getByText("@TestUser");
      expect(badge).toHaveAttribute("title", "@TestUser");
    });

    it("should render multiple mention badges correctly", () => {
      const content = "@[User1](id1) @[User2](id2) @[User3](id3)";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@User1")).toHaveAttribute("title", "@User1");
      expect(screen.getByText("@User2")).toHaveAttribute("title", "@User2");
      expect(screen.getByText("@User3")).toHaveAttribute("title", "@User3");
    });
  });

  describe("Mixed Content", () => {
    it("should render text before and after mentions", () => {
      const content = "Hey @[Alice](user-1), can you help @[Bob](user-2) with this?";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("Hey")).toBeInTheDocument();
      expect(screen.getByText("@Alice")).toBeInTheDocument();
      expect(screen.getByText(", can you help")).toBeInTheDocument();
      expect(screen.getByText("@Bob")).toBeInTheDocument();
      expect(screen.getByText("with this?")).toBeInTheDocument();
    });

    it("should handle mentions in multiline content", () => {
      const content = "Line 1 @[User1](u1)\nLine 2 @[User2](u2)";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@User1")).toBeInTheDocument();
      expect(screen.getByText("@User2")).toBeInTheDocument();
    });

    it("should handle mentions with surrounding punctuation", () => {
      const content = "Hey @[User](user-1)! How are you?";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("Hey")).toBeInTheDocument();
      expect(screen.getByText("@User")).toBeInTheDocument();
      expect(screen.getByText("! How are you?")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed mention syntax (missing closing bracket)", () => {
      const content = "Hello @[User without closing";
      render(<CommentRenderer content={content} />);

      // Should render as plain text since it doesn't match the pattern
      expect(screen.getByText("Hello @[User without closing")).toBeInTheDocument();
    });

    it("should handle malformed mention syntax (missing closing paren)", () => {
      const content = "Hello @[User](no-closing";
      render(<CommentRenderer content={content} />);

      // Should render as plain text
      expect(screen.getByText("Hello @[User](no-closing")).toBeInTheDocument();
    });

    it("should handle empty mention name", () => {
      const content = "Hello @[](user-id)";
      render(<CommentRenderer content={content} />);

      // Pattern requires at least one character in name, so renders as plain text
      expect(screen.getByText("Hello @[](user-id)")).toBeInTheDocument();
    });

    it("should handle empty user id", () => {
      const content = "Hello @[User]()";
      render(<CommentRenderer content={content} />);

      // Pattern requires at least one character in user ID, so renders as plain text
      expect(screen.getByText("Hello @[User]()")).toBeInTheDocument();
    });

    it("should handle @ symbol not in mention format", () => {
      const content = "Email me @ test@example.com";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("Email me @ test@example.com")).toBeInTheDocument();
    });

    it("should handle consecutive mentions without spacing", () => {
      const content = "@[User1](id1)@[User2](id2)@[User3](id3)";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@User1")).toBeInTheDocument();
      expect(screen.getByText("@User2")).toBeInTheDocument();
      expect(screen.getByText("@User3")).toBeInTheDocument();
    });

    it("should handle mention with newlines in between", () => {
      const content = "Start\n@[User](id)\nEnd";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText(/Start/)).toBeInTheDocument();
      expect(screen.getByText("@User")).toBeInTheDocument();
      expect(screen.getByText(/End/)).toBeInTheDocument();
    });
  });

  describe("Mentions Prop", () => {
    it("should accept mentions array (though not currently used in rendering)", () => {
      const mentions = ["user-1", "user-2"] as Id<"users">[];
      render(<CommentRenderer content="Test @[User](user-1)" mentions={mentions} />);

      expect(screen.getByText("@User")).toBeInTheDocument();
    });

    it("should work without mentions prop", () => {
      render(<CommentRenderer content="Test @[User](user-1)" />);

      expect(screen.getByText("@User")).toBeInTheDocument();
    });

    it("should handle empty mentions array", () => {
      render(<CommentRenderer content="Test @[User](user-1)" mentions={[]} />);

      expect(screen.getByText("@User")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper container styling", () => {
      const { container } = render(<CommentRenderer content="Test" />);

      const commentDiv = container.firstChild;
      expect(commentDiv).toHaveClass("text-ui-text-secondary");
      expect(commentDiv).toHaveClass("whitespace-pre-wrap");
      expect(commentDiv).toHaveClass("break-words");
    });

    it("should preserve text readability with whitespace-pre-wrap", () => {
      const content = "Line 1\n  Indented Line 2\n\nLine 4";
      const { container } = render(<CommentRenderer content={content} />);

      const commentDiv = container.firstChild;
      expect(commentDiv).toHaveClass("whitespace-pre-wrap");
      expect(commentDiv?.textContent).toBe(content);
    });

    it("should use cursor-default on mention badges", () => {
      render(<CommentRenderer content="@[User](user-1)" />);

      const badge = screen.getByText("@User");
      expect(badge).toHaveClass("cursor-default");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle a realistic comment with multiple mentions and text", () => {
      const content =
        "Hey @[Alice](alice-id), I've reviewed the code with @[Bob](bob-id) and @[Charlie](charlie-id).\n\nWe think the approach looks good! Can you merge it?\n\nThanks,\n@[David](david-id)";

      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@Alice")).toBeInTheDocument();
      expect(screen.getByText("@Bob")).toBeInTheDocument();
      expect(screen.getByText("@Charlie")).toBeInTheDocument();
      expect(screen.getByText("@David")).toBeInTheDocument();
      expect(screen.getByText(/We think the approach looks good/)).toBeInTheDocument();
    });

    it("should handle comment with only mentions", () => {
      const content = "@[User1](id1) @[User2](id2) @[User3](id3)";
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@User1")).toBeInTheDocument();
      expect(screen.getByText("@User2")).toBeInTheDocument();
      expect(screen.getByText("@User3")).toBeInTheDocument();
    });

    it("should handle very long comment with mentions", () => {
      const longText = "A".repeat(500);
      const content = `${longText} @[User](user-id) ${longText}`;
      render(<CommentRenderer content={content} />);

      expect(screen.getByText("@User")).toBeInTheDocument();
    });
  });
});
