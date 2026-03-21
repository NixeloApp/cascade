import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Container } from "./Container";

describe("Container", () => {
  it("renders a shared max-width wrapper", () => {
    render(
      <Container size="lg" data-testid="container">
        Content
      </Container>,
    );

    expect(screen.getByTestId("container").className).toContain("max-w-6xl");
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("supports swapping the rendered element", () => {
    render(
      <Container as="nav" size="lg" aria-label="Primary navigation">
        Nav
      </Container>,
    );

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
  });

  it("supports the full shared page-width token set", () => {
    const { rerender } = render(
      <Container size="sm" data-testid="container">
        Content
      </Container>,
    );

    expect(screen.getByTestId("container").className).toContain("max-w-3xl");

    rerender(
      <Container size="5xl" data-testid="container">
        Content
      </Container>,
    );
    expect(screen.getByTestId("container").className).toContain("max-w-5xl");

    rerender(
      <Container size="2xl" data-testid="container">
        Content
      </Container>,
    );
    expect(screen.getByTestId("container").className).toContain("max-w-screen-2xl");
  });

  it("supports shared page-shell padding", () => {
    render(
      <Container padding="page" data-testid="container">
        Content
      </Container>,
    );

    expect(screen.getByTestId("container")).toHaveClass(
      "px-4",
      "py-5",
      "sm:px-6",
      "sm:py-6",
      "lg:px-8",
    );
  });
});
