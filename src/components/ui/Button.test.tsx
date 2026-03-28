import { fireEvent, render, screen } from "@testing-library/react";
import { Plus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "./Button";

describe("Button", () => {
  it("renders a button element with button type by default", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole("button", { name: "Click me" })).toHaveAttribute("type", "button");
  });

  it("forwards refs to the underlying button element", () => {
    const ref = { current: null as HTMLButtonElement | null };

    render(<Button ref={ref}>With Ref</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("renders as a child element without forcing a button type", () => {
    render(
      <Button asChild>
        <a href="/home">Home</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("type");
  });

  it("applies the default primary styling", () => {
    render(<Button data-testid="btn">Primary</Button>);

    expect(screen.getByTestId("btn").className).toContain("bg-linear-to-r");
  });

  it("supports the reduced semantic variants", () => {
    render(
      <>
        <Button variant="secondary" data-testid="secondary">
          Secondary
        </Button>
        <Button variant="ghost" data-testid="ghost">
          Ghost
        </Button>
        <Button variant="ghostDanger" data-testid="ghost-danger">
          Delete
        </Button>
        <Button variant="success" data-testid="success">
          Success
        </Button>
        <Button variant="danger" data-testid="danger">
          Danger
        </Button>
        <Button variant="link" data-testid="link">
          Link
        </Button>
        <Button variant="outline" data-testid="outline">
          Outline
        </Button>
      </>,
    );

    expect(screen.getByTestId("secondary").className).toContain("bg-ui-bg");
    expect(screen.getByTestId("ghost").className).toContain("hover:bg-ui-bg-hover");
    expect(screen.getByTestId("ghost-danger").className).toContain("text-status-error");
    expect(screen.getByTestId("success").className).toContain("bg-status-success");
    expect(screen.getByTestId("danger").className).toContain("bg-status-error");
    expect(screen.getByTestId("link").className).toContain("underline-offset-4");
    expect(screen.getByTestId("outline").className).toContain("border");
  });

  it("supports the reduced size contract", () => {
    render(
      <>
        <Button size="content" data-testid="content">
          Content
        </Button>
        <Button size="sm" data-testid="sm">
          Small
        </Button>
        <Button size="lg" data-testid="lg">
          Large
        </Button>
        <Button size="icon" data-testid="icon">
          <Plus />
        </Button>
      </>,
    );

    expect(screen.getByTestId("content").className).toContain("h-auto");
    expect(screen.getByTestId("sm").className).toContain("h-9");
    expect(screen.getByTestId("lg").className).toContain("h-11");
    expect(screen.getByTestId("icon").className).toContain("w-10");
  });

  it("merges custom class names with the base recipe", () => {
    render(
      <Button className="custom-class" data-testid="btn">
        Custom
      </Button>,
    );

    expect(screen.getByTestId("btn").className).toContain("custom-class");
    expect(screen.getByTestId("btn").className).toContain("inline-flex");
  });

  it("renders left and right icons when provided", () => {
    render(
      <Button leftIcon={<Plus data-testid="left" />} rightIcon={<Plus data-testid="right" />}>
        Both
      </Button>,
    );

    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("disables the button and suppresses clicks when disabled", () => {
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows a loading spinner and disables the button while loading", () => {
    render(
      <Button isLoading data-testid="btn">
        Submit
      </Button>,
    );

    const button = screen.getByTestId("btn");
    expect(button).toBeDisabled();
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("keeps the accessible name when an icon button is loading", () => {
    render(
      <Button isLoading size="icon">
        <span className="sr-only">Save</span>
        <Plus aria-hidden="true" />
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls onClick when activated", () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("buttonVariants", () => {
  it("returns default classes when called without options", () => {
    const classes = buttonVariants();

    expect(classes).toContain("bg-linear-to-r");
    expect(classes).toContain("h-10");
  });

  it("returns combined classes for explicit variant and size options", () => {
    const classes = buttonVariants({ variant: "danger", size: "lg" });

    expect(classes).toContain("bg-status-error");
    expect(classes).toContain("h-11");
  });
});
