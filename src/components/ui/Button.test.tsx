import { fireEvent, render, screen } from "@testing-library/react";
import { Plus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "./Button";

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
      expect(btn.className).toContain("bg-brand");
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
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("is disabled when loading", () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("hides children when loading", () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.queryByText("Submit")).not.toBeInTheDocument();
    });

    it("shows spinner icon when loading", () => {
      render(
        <Button isLoading data-testid="btn">
          Submit
        </Button>,
      );
      const btn = screen.getByTestId("btn");
      const spinner = btn.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("does not render loading text when size is icon", () => {
      render(
        <Button isLoading size="icon">
          <Plus />
        </Button>,
      );
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
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
      expect(classes).toContain("bg-brand");
      expect(classes).toContain("h-10");
    });
  });
});
