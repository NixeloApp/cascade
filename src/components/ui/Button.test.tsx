import { fireEvent, render, screen } from "@testing-library/react";
import { Plus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonChromeVariants, buttonVariants } from "./Button";

describe("Button", () => {
  describe("rendering", () => {
    it("renders children text", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("renders as button element by default", () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has type='button' by default", () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("accepts custom type", () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("forwards ref correctly", () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>With Ref</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("variants", () => {
    it("applies primary variant by default", () => {
      render(<Button data-testid="btn">Primary</Button>);
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("bg-linear-to-r");
      expect(btn.className).toContain("from-landing-accent");
    });

    it("applies secondary variant", () => {
      render(
        <Button variant="secondary" data-testid="btn">
          Secondary
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("border");
      expect(btn.className).toContain("bg-ui-bg");
    });

    it("applies brandSolid variant", () => {
      render(
        <Button variant="brandSolid" data-testid="btn">
          Upgrade
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("bg-brand");
      expect(btn.className).toContain("shadow-brand/20");
      expect(btn.className).toContain("hover:bg-brand-hover");
    });

    it("applies ghost variant", () => {
      render(
        <Button variant="ghost" data-testid="btn">
          Ghost
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("hover:bg-ui-bg-hover");
    });

    it("applies danger variant", () => {
      render(
        <Button variant="danger" data-testid="btn">
          Delete
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("bg-status-error");
    });

    it("applies ghostLink variant", () => {
      render(
        <Button variant="ghostLink" size="content" data-testid="btn">
          Back
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("text-ui-text-secondary");
      expect(btn.className).toContain("hover:bg-transparent");
      expect(btn.className).toContain("h-auto");
    });

    it("applies ghostTertiary variant", () => {
      render(
        <Button variant="ghostTertiary" data-testid="btn">
          Skip
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("hover:bg-ui-bg-tertiary");
      expect(btn.className).toContain("hover:text-ui-text");
    });

    it("applies success variant", () => {
      render(
        <Button variant="success" data-testid="btn">
          Confirm
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("bg-status-success");
    });

    it("applies link variant", () => {
      render(
        <Button variant="link" data-testid="btn">
          Learn more
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("text-brand");
      expect(btn.className).toContain("underline-offset-4");
    });

    it("applies outline variant", () => {
      render(
        <Button variant="outline" data-testid="btn">
          Outline
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("bg-transparent");
      expect(btn.className).toContain("border");
    });

    it("applies chrome styling through explicit props", () => {
      render(
        <Button chrome="framed" chromeSize="pill" data-testid="btn">
          Chrome
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("bg-ui-bg-elevated/94");
      expect(btn.className).toContain("rounded-full");
      expect(btn.className).not.toContain("bg-linear-to-r");
    });

    it("applies document tree section chrome styling", () => {
      render(
        <Button
          chrome="documentTreeSectionMuted"
          chromeSize="documentTreeSection"
          data-testid="btn"
        >
          Archived
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("text-ui-text-tertiary");
      expect(btn.className).toContain("w-full");
      expect(btn.className).toContain("justify-start");
      expect(btn.className).toContain("px-2");
    });

    it("applies roadmap chrome styling", () => {
      render(
        <Button chrome="roadmapGroupRow" chromeSize="roadmapGroupRow" data-testid="btn">
          Group
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("bg-ui-bg-secondary/60");
      expect(btn.className).toContain("border-ui-border");
      expect(btn.className).toContain("w-full");
      expect(btn.className).toContain("text-left");
    });
  });

  describe("sizes", () => {
    it("applies md size by default", () => {
      render(<Button data-testid="btn">Medium</Button>);
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-10");
      expect(btn.className).toContain("px-4");
    });

    it("applies sm size", () => {
      render(
        <Button size="sm" data-testid="btn">
          Small
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-9");
      expect(btn.className).toContain("px-3");
    });

    it("applies xs size", () => {
      render(
        <Button size="xs" data-testid="btn">
          Compact
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-7");
      expect(btn.className).toContain("px-2");
    });

    it("applies contentStart size", () => {
      render(
        <Button variant="unstyled" size="contentStart" data-testid="btn">
          Row
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-auto");
      expect(btn.className).toContain("text-left");
      expect(btn.className).toContain("px-0");
    });

    it("applies card size", () => {
      render(
        <Button variant="unstyled" size="card" data-testid="btn">
          Card
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("group");
      expect(btn.className).toContain("w-full");
      expect(btn.className).toContain("overflow-hidden");
    });

    it("applies lg size", () => {
      render(
        <Button size="lg" data-testid="btn">
          Large
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-11");
      expect(btn.className).toContain("px-6");
    });

    it("applies icon size", () => {
      render(
        <Button size="icon" data-testid="btn">
          <Plus />
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-10");
      expect(btn.className).toContain("w-10");
    });

    it("applies iconXs size", () => {
      render(
        <Button size="iconXs" data-testid="btn">
          <Plus />
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-6");
      expect(btn.className).toContain("w-6");
      expect(btn.className).toContain("p-1");
    });

    it("applies iconSm size", () => {
      render(
        <Button size="iconSm" data-testid="btn">
          <Plus />
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-8");
      expect(btn.className).toContain("w-8");
    });

    it("applies workspace icon size", () => {
      render(
        <Button size="workspaceIcon" data-testid="btn">
          🏢
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-10");
      expect(btn.className).toContain("w-10");
      expect(btn.className).toContain("text-lg");
    });

    it("applies chrome icon size without inheriting default button sizing", () => {
      render(
        <Button chrome="quiet" chromeSize="icon" data-testid="btn">
          <Plus />
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-9");
      expect(btn.className).toContain("w-9");
      expect(btn.className).not.toContain("h-10");
    });

    it("applies document tree toggle sizing", () => {
      render(
        <Button chrome="documentTreeToggle" chromeSize="documentTreeToggle" data-testid="btn">
          <Plus />
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-5");
      expect(btn.className).toContain("w-5");
      expect(btn.className).toContain("p-0.5");
    });

    it("applies searchTrigger chrome sizing", () => {
      render(
        <Button chrome="framed" chromeSize="searchTrigger" data-testid="btn">
          Search
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("w-full");
      expect(btn.className).toContain("min-w-0");
      expect(btn.className).toContain("sm:justify-between");
    });

    it("applies roadmap resize handle sizing", () => {
      render(
        <Button chrome="roadmapResizeHandle" chromeSize="roadmapResizeLeft" data-testid="btn">
          Handle
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("absolute");
      expect(btn.className).toContain("left-0");
      expect(btn.className).toContain("w-2");
      expect(btn.className).toContain("cursor-ew-resize");
    });

    it("applies compact chrome pill sizing", () => {
      render(
        <Button chrome="quiet" chromeSize="compactPillSm" data-testid="btn">
          Mentions
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("h-7");
      expect(btn.className).toContain("rounded-full");
      expect(btn.className).toContain("px-3");
    });
  });

  describe("disabled state", () => {
    it("can be disabled", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("applies disabled styles", () => {
      render(
        <Button disabled data-testid="btn">
          Disabled
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("disabled:opacity-50");
      expect(btn.className).toContain("disabled:pointer-events-none");
    });

    it("does not call onClick when disabled", () => {
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Disabled
        </Button>,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading", () => {
      render(
        <Button isLoading data-testid="btn">
          Submit
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      const spinner = btn.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });

    it("keeps children visible when loading (for non-icon size)", () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText("Submit")).toBeInTheDocument();
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("is disabled when loading", () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("renders children visually hidden when loading if size is icon", () => {
      render(
        <Button isLoading size="icon">
          <Plus data-testid="icon-child" />
        </Button>,
      );
      const child = screen.getByTestId("icon-child");
      expect(child).toBeInTheDocument();
      expect(child.parentElement).toHaveClass("sr-only");
      const btn = screen.getByRole("button");
      const spinner = btn.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("preserves accessible name when loading if provided via sr-only", () => {
      render(
        <Button isLoading size="icon">
          <span className="sr-only">Save</span>
          <Plus aria-hidden="true" />
        </Button>,
      );
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });
  });

  describe("icons", () => {
    it("renders left icon", () => {
      render(
        <Button leftIcon={<Plus data-testid="left-icon" />} data-testid="btn">
          Add
        </Button>,
      );
      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    });

    it("renders right icon", () => {
      render(
        <Button rightIcon={<Plus data-testid="right-icon" />} data-testid="btn">
          Next
        </Button>,
      );
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });

    it("renders both icons", () => {
      render(
        <Button
          leftIcon={<Plus data-testid="left" />}
          rightIcon={<Plus data-testid="right" />}
          data-testid="btn"
        >
          Both
        </Button>,
      );
      expect(screen.getByTestId("left")).toBeInTheDocument();
      expect(screen.getByTestId("right")).toBeInTheDocument();
    });

    it("does not render icons when loading", () => {
      render(
        <Button
          isLoading
          leftIcon={<Plus data-testid="left" />}
          rightIcon={<Plus data-testid="right" />}
        >
          Loading
        </Button>,
      );
      expect(screen.queryByTestId("left")).not.toBeInTheDocument();
      expect(screen.queryByTestId("right")).not.toBeInTheDocument();
    });
  });

  describe("asChild", () => {
    it("renders link element when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/home">Home</a>
        </Button>,
      );
      const link = screen.getByRole("link", { name: "Home" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/home");
    });

    it("does not have type attribute when asChild", () => {
      render(
        <Button asChild>
          <a href="/home">Home</a>
        </Button>,
      );
      expect(screen.getByRole("link")).not.toHaveAttribute("type");
    });
  });

  describe("click handler", () => {
    it("calls onClick when clicked", () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("custom className", () => {
    it("merges custom className", () => {
      render(
        <Button className="custom-class" data-testid="btn">
          Custom
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      expect(btn.className).toContain("custom-class");
      expect(btn.className).toContain("inline-flex"); // Base class still present
    });
  });

  describe("buttonVariants", () => {
    it("returns correct classes for variant combinations", () => {
      const classes = buttonVariants({ variant: "danger", size: "lg" });
      expect(classes).toContain("bg-status-error");
      expect(classes).toContain("h-11");
    });

    it("returns default classes when no options provided", () => {
      const classes = buttonVariants();
      expect(classes).toContain("bg-linear-to-r");
      expect(classes).toContain("h-10");
    });
  });

  describe("buttonChromeVariants", () => {
    it("returns chrome classes for framed compact pill buttons", () => {
      const classes = buttonChromeVariants({ chrome: "framed", chromeSize: "compactPill" });
      expect(classes).toContain("bg-ui-bg-elevated/94");
      expect(classes).toContain("h-8");
      expect(classes).toContain("rounded-full");
    });
  });
});
