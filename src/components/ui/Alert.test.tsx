import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./Alert";

describe("Alert", () => {
  it("renders with role='status' for default variant", () => {
    render(
      <Alert>
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>Test Description</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders with role='status' for info variant", () => {
    render(
      <Alert variant="info">
        <AlertTitle>Info Alert</AlertTitle>
      </Alert>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with role='status' for success variant", () => {
    render(
      <Alert variant="success">
        <AlertTitle>Success Alert</AlertTitle>
      </Alert>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with role='alert' for warning variant", () => {
    render(
      <Alert variant="warning">
        <AlertTitle>Warning Alert</AlertTitle>
      </Alert>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders with role='alert' for error variant", () => {
    render(
      <Alert variant="error">
        <AlertTitle>Error Alert</AlertTitle>
      </Alert>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("ensures default icon has aria-hidden='true'", () => {
    const { container } = render(
      <Alert variant="info">
        <AlertTitle>Info</AlertTitle>
      </Alert>,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
