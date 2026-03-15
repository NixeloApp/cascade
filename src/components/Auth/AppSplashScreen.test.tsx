import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AppSplashScreen } from "./AppSplashScreen";

vi.mock("../Landing/Icons", () => ({
  NixeloLogo: ({ size }: { size: number }) => <div data-testid="nixelo-logo" data-size={size} />,
}));

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

describe("AppSplashScreen", () => {
  it("renders the logo", () => {
    render(<AppSplashScreen />);

    expect(screen.getByTestId("nixelo-logo")).toBeInTheDocument();
  });

  it("renders optional message", () => {
    render(<AppSplashScreen message="Connecting to workspace..." />);

    expect(screen.getByText("Connecting to workspace...")).toBeInTheDocument();
  });

  it("does not render message when not provided", () => {
    render(<AppSplashScreen />);

    expect(screen.queryByText("Connecting")).not.toBeInTheDocument();
  });
});
