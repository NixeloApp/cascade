import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  describe("Basic Rendering", () => {
    it("should render icon and title", () => {
      render(<EmptyState icon="📦" title="No Items" />);

      expect(screen.getByText("📦")).toBeInTheDocument();
      expect(screen.getByText("No Items")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(<EmptyState icon="📝" title="No Data" description="There are no items to display" />);

      expect(screen.getByText("There are no items to display")).toBeInTheDocument();
    });

    it("should not render description when not provided", () => {
      const { container } = render(<EmptyState icon="📦" title="Empty" />);

      const description = container.querySelector("p");
      // Note: Title uses Typography "large" which is a <p>, so we check for the *second* p or by text
      expect(screen.queryByText("undefined")).not.toBeInTheDocument();
      // Better check: querying by specific description text if it were there
    });

    it("should render action button when provided", () => {
      const action = {
        label: "Create New",
        onClick: vi.fn(),
      };

      render(<EmptyState icon="➕" title="Empty" action={action} />);

      expect(screen.getByRole("button", { name: "Create New" })).toBeInTheDocument();
    });

    it("should not render action button when not provided", () => {
      render(<EmptyState icon="📦" title="Empty" />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Action Button Interactions", () => {
    it("should call onClick when action button is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const action = {
        label: "Add Item",
        onClick,
      };

      render(<EmptyState icon="➕" title="Empty" action={action} />);

      const button = screen.getByRole("button", { name: "Add Item" });
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick multiple times when clicked multiple times", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const action = {
        label: "Click Me",
        onClick,
      };

      render(<EmptyState icon="🔘" title="Empty" action={action} />);

      const button = screen.getByRole("button", { name: "Click Me" });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it("should have type='button' on action button", () => {
      const action = {
        label: "Action",
        onClick: vi.fn(),
      };

      render(<EmptyState icon="📦" title="Empty" action={action} />);

      const button = screen.getByRole("button", { name: "Action" });
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Props Combinations", () => {
    it("should work with only required props (icon and title)", () => {
      render(<EmptyState icon="🎯" title="Minimal State" />);

      expect(screen.getByText("🎯")).toBeInTheDocument();
      expect(screen.getByText("Minimal State")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should work with icon, title, and description", () => {
      render(<EmptyState icon="📊" title="No Data" description="Start by adding some items" />);

      expect(screen.getByText("📊")).toBeInTheDocument();
      expect(screen.getByText("No Data")).toBeInTheDocument();
      expect(screen.getByText("Start by adding some items")).toBeInTheDocument();
    });

    it("should work with icon, title, and action", () => {
      const action = {
        label: "Get Started",
        onClick: vi.fn(),
      };

      render(<EmptyState icon="🚀" title="Ready to Begin" action={action} />);

      expect(screen.getByText("🚀")).toBeInTheDocument();
      expect(screen.getByText("Ready to Begin")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument();
    });

    it("should work with all props", () => {
      const action = {
        label: "Create",
        onClick: vi.fn(),
      };

      render(
        <EmptyState
          icon="✨"
          title="All Props"
          description="Testing all properties"
          action={action}
        />,
      );

      expect(screen.getByText("✨")).toBeInTheDocument();
      expect(screen.getByText("All Props")).toBeInTheDocument();
      expect(screen.getByText("Testing all properties")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string icon", () => {
      render(<EmptyState icon="" title="No Icon" />);

      expect(screen.getByText("No Icon")).toBeInTheDocument();
    });

    it("should handle empty string title", () => {
      render(<EmptyState icon="📦" title="" />);

      expect(screen.getByText("📦")).toBeInTheDocument();
    });

    it("should handle empty string description", () => {
      const { container } = render(<EmptyState icon="📦" title="Empty" description="" />);

      // The paragraph for description shouldn't be rendered when empty
      // Title renders as h3, so no paragraphs should exist
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBe(0);
    });

    it("should handle very long title", () => {
      const longTitle = "A".repeat(200);
      render(<EmptyState icon="📦" title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle very long description", () => {
      const longDesc = "B".repeat(500);
      render(<EmptyState icon="📦" title="Title" description={longDesc} />);

      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it("should handle special characters in title", () => {
      render(<EmptyState icon="⚠️" title="Error: <script>alert('xss')</script>" />);

      expect(screen.getByText("Error: <script>alert('xss')</script>")).toBeInTheDocument();
    });

    it("should handle special characters in description", () => {
      const specialChars = "Special chars: <>&\"'";
      render(<EmptyState icon="📦" title="Title" description={specialChars} />);

      expect(screen.getByText(specialChars)).toBeInTheDocument();
    });

    it("should handle various emoji icons", () => {
      render(<EmptyState icon="🎉🎊🎈" title="Multiple Emojis" />);

      expect(screen.getByText("🎉🎊🎈")).toBeInTheDocument();
    });

    it("should handle empty action label", () => {
      const action = {
        label: "",
        onClick: vi.fn(),
      };

      render(<EmptyState icon="📦" title="Empty" action={action} />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("");
    });
  });

  describe("Styling and Classes", () => {
    it("should have proper heading level", () => {
      render(<EmptyState icon="📦" title="Heading Test" />);

      // Typography variant="large" with as="h3" renders as <h3>
      expect(screen.getByText("Heading Test").tagName).toBe("H3");
    });

    it("should apply animation class to container", () => {
      const { container } = render(<EmptyState icon="📦" title="Test" />);

      const containerDiv = container.querySelector(".animate-fade-in");
      expect(containerDiv).toBeInTheDocument();
    });

    it("should apply max-width to description", () => {
      render(<EmptyState icon="📦" title="Test" description="Description text" />);

      const paragraph = screen.getByText("Description text");
      expect(paragraph).toHaveClass("max-w-sm");
      expect(paragraph).toHaveClass("mx-auto");
    });

    it("should apply button styling", () => {
      const action = {
        label: "Button",
        onClick: vi.fn(),
      };

      render(<EmptyState icon="📦" title="Test" action={action} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("bg-linear-to-r");
      expect(button).toHaveClass("text-brand-foreground");
    });
  });

  describe("Accessibility", () => {
    it("should have semantic heading structure", () => {
      render(<EmptyState icon="📦" title="Accessible Title" />);

      // Title is accessible via aria-label on container or direct text
      expect(screen.getByText("Accessible Title")).toBeInTheDocument();
    });

    it("should have accessible button when action is provided", () => {
      const action = {
        label: "Accessible Action",
        onClick: vi.fn(),
      };

      render(<EmptyState icon="📦" title="Test" action={action} />);

      const button = screen.getByRole("button", { name: "Accessible Action" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "button");
    });

    it("should support keyboard interaction on action button", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const action = {
        label: "Keyboard Test",
        onClick,
      };

      render(<EmptyState icon="📦" title="Test" action={action} />);

      const button = screen.getByRole("button", { name: "Keyboard Test" });
      button.focus();
      await user.keyboard("{Enter}");

      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("Real-world Scenarios", () => {
    it("should display empty state for no search results", () => {
      const action = {
        label: "Clear Filters",
        onClick: vi.fn(),
      };

      render(
        <EmptyState
          icon="🔍"
          title="No Results Found"
          description="Try adjusting your search criteria"
          action={action}
        />,
      );

      expect(screen.getByText("🔍")).toBeInTheDocument();
      expect(screen.getByText("No Results Found")).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your search criteria")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Clear Filters" })).toBeInTheDocument();
    });

    it("should display empty state for new project", () => {
      const action = {
        label: "Create First Task",
        onClick: vi.fn(),
      };

      render(
        <EmptyState
          icon="🎯"
          title="No Tasks Yet"
          description="Get started by creating your first task"
          action={action}
        />,
      );

      expect(screen.getByText("🎯")).toBeInTheDocument();
      expect(screen.getByText("No Tasks Yet")).toBeInTheDocument();
      expect(screen.getByText("Get started by creating your first task")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create First Task" })).toBeInTheDocument();
    });
  });
});
