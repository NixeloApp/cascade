import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AvatarGroup } from "./Avatar";

describe("Avatar", () => {
  describe("rendering", () => {
    it("renders with accessible name from name", async () => {
      render(<Avatar name="John Doe" />);
      await waitFor(() => {
        expect(screen.getByRole("img", { name: "John Doe" })).toBeInTheDocument();
      });
    });

    it("renders with accessible name from single name", async () => {
      render(<Avatar name="John" />);
      await waitFor(() => {
        expect(screen.getByRole("img", { name: "John" })).toBeInTheDocument();
      });
    });

    it("renders with accessible name from email when no name", async () => {
      render(<Avatar email="john@example.com" />);
      await waitFor(() => {
        expect(screen.getByRole("img", { name: "john@example.com" })).toBeInTheDocument();
      });
    });

    it("renders with default accessible name when no name or email", async () => {
      render(<Avatar />);
      await waitFor(() => {
        expect(screen.getByRole("img", { name: "User avatar" })).toBeInTheDocument();
      });
    });

    it("hides initials from screen readers", async () => {
      render(<Avatar name="John Doe" />);
      await waitFor(() => {
        expect(screen.queryByText("JD")).not.toBeInTheDocument();
      });
    });
  });

  describe("initials generation (visual only)", () => {
    // These tests verify that initials are generated correctly, even if hidden from screen readers
    // We query the container text content or specific element since getByText doesn't support hidden: true
    // with certain TypeScript configurations for SelectorMatcherOptions.
    it("uses first and last name initials", async () => {
      const { container } = render(<Avatar name="John William Doe" />);
      await waitFor(() => {
        expect(container.textContent).toContain("JD");
      });
    });

    it("handles names with extra whitespace", async () => {
      const { container } = render(<Avatar name="  John   Doe  " />);
      await waitFor(() => {
        expect(container.textContent).toContain("JD");
      });
    });

    it("converts initials to uppercase", async () => {
      const { container } = render(<Avatar name="john doe" />);
      await waitFor(() => {
        expect(container.textContent).toContain("JD");
      });
    });

    it("handles email with uppercase", async () => {
      const { container } = render(<Avatar email="John@example.com" />);
      await waitFor(() => {
        expect(container.textContent).toContain("J");
      });
    });
  });

  describe("sizes", () => {
    it("applies default size (md)", () => {
      render(<Avatar name="JD" data-testid="avatar" />);
      const root = document.querySelector('[class*="w-8"]');
      expect(root).toBeInTheDocument();
    });

    it("applies xs size", () => {
      render(<Avatar name="JD" size="xs" />);
      const root = document.querySelector('[class*="w-5"]');
      expect(root).toBeInTheDocument();
    });

    it("applies sm size", () => {
      render(<Avatar name="JD" size="sm" />);
      const root = document.querySelector('[class*="w-6"]');
      expect(root).toBeInTheDocument();
    });

    it("applies lg size", () => {
      render(<Avatar name="JD" size="lg" />);
      const root = document.querySelector('[class*="w-10"]');
      expect(root).toBeInTheDocument();
    });

    it("applies xl size", () => {
      render(<Avatar name="JD" size="xl" />);
      const root = document.querySelector('[class*="w-12"]');
      expect(root).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("applies soft variant by default", async () => {
      render(<Avatar name="JD" />);
      await waitFor(() => {
        const fallback = document.querySelector('[class*="bg-ui-bg-soft"]');
        expect(fallback).toBeInTheDocument();
      });
    });

    it("applies brand variant", async () => {
      render(<Avatar name="JD" variant="brand" />);
      await waitFor(() => {
        const fallback = document.querySelector('[class*="bg-brand"]');
        expect(fallback).toBeInTheDocument();
      });
    });

    it("applies neutral variant", async () => {
      render(<Avatar name="JD" variant="neutral" />);
      await waitFor(() => {
        const fallback = document.querySelector('[class*="bg-ui-bg-tertiary"]');
        expect(fallback).toBeInTheDocument();
      });
    });

    it("applies success variant", async () => {
      render(<Avatar name="JD" variant="success" />);
      await waitFor(() => {
        const fallback = document.querySelector('[class*="bg-status-success"]');
        expect(fallback).toBeInTheDocument();
      });
    });

    it("applies warning variant", async () => {
      render(<Avatar name="JD" variant="warning" />);
      await waitFor(() => {
        const fallback = document.querySelector('[class*="bg-status-warning"]');
        expect(fallback).toBeInTheDocument();
      });
    });

    it("applies error variant", async () => {
      render(<Avatar name="JD" variant="error" />);
      await waitFor(() => {
        const fallback = document.querySelector('[class*="bg-status-error"]');
        expect(fallback).toBeInTheDocument();
      });
    });
  });

  describe("custom className", () => {
    it("merges custom className", () => {
      render(<Avatar name="JD" className="custom-class" />);
      const root = document.querySelector(".custom-class");
      expect(root).toBeInTheDocument();
    });
  });
});

describe("AvatarGroup", () => {
  describe("rendering", () => {
    it("renders all children", async () => {
      render(
        <AvatarGroup>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" />
          <Avatar name="Bob Wilson" />
        </AvatarGroup>,
      );

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "John Doe" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Jane Smith" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Bob Wilson" })).toBeInTheDocument();
      });
    });

    it("applies overlap classes to non-first children", () => {
      render(
        <AvatarGroup>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" />
        </AvatarGroup>,
      );

      const containers = document.querySelectorAll('[class*="ring-2"]');
      expect(containers[0].className).not.toContain("-ml-");
      expect(containers[1].className).toContain("-ml-");
    });
  });

  describe("max prop", () => {
    it("limits visible avatars when max is provided", async () => {
      render(
        <AvatarGroup max={2}>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" />
          <Avatar name="Bob Wilson" />
          <Avatar name="Alice Brown" />
        </AvatarGroup>,
      );

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "John Doe" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Jane Smith" })).toBeInTheDocument();
      });
      expect(screen.queryByRole("img", { name: "Bob Wilson" })).not.toBeInTheDocument();
      expect(screen.queryByRole("img", { name: "Alice Brown" })).not.toBeInTheDocument();
    });

    it("shows overflow count when max is exceeded", () => {
      render(
        <AvatarGroup max={2}>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" />
          <Avatar name="Bob Wilson" />
          <Avatar name="Alice Brown" />
        </AvatarGroup>,
      );

      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("does not show overflow when max equals children count", () => {
      render(
        <AvatarGroup max={2}>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" />
        </AvatarGroup>,
      );

      expect(screen.queryByText("+")).not.toBeInTheDocument();
    });

    it("shows all avatars when max is greater than children count", async () => {
      render(
        <AvatarGroup max={10}>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" />
        </AvatarGroup>,
      );

      await waitFor(() => {
        expect(screen.getByRole("img", { name: "John Doe" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Jane Smith" })).toBeInTheDocument();
      });
      expect(screen.queryByText("+")).not.toBeInTheDocument();
    });
  });

  describe("size prop", () => {
    it("uses md size by default", () => {
      render(
        <AvatarGroup>
          <Avatar name="John Doe" />
          <Avatar name="Jane Smith" />
        </AvatarGroup>,
      );

      const overlappedAvatar = document.querySelector('[class*="-ml-2.5"]');
      expect(overlappedAvatar).toBeInTheDocument();
    });

    it("applies size-appropriate overlap for sm", () => {
      render(
        <AvatarGroup size="sm">
          <Avatar name="John Doe" size="sm" />
          <Avatar name="Jane Smith" size="sm" />
        </AvatarGroup>,
      );

      const overlappedAvatar = document.querySelector('[class*="-ml-2"]');
      expect(overlappedAvatar).toBeInTheDocument();
    });
  });

  describe("custom className", () => {
    it("applies custom className to container", () => {
      render(
        <AvatarGroup className="custom-group">
          <Avatar name="John Doe" />
        </AvatarGroup>,
      );

      const container = document.querySelector(".custom-group");
      expect(container).toBeInTheDocument();
    });
  });
});
