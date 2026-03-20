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
});
