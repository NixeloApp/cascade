import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { NixeloLogo } from "./Icons";

describe("NixeloLogo", () => {
  it("renders SVG with default size", () => {
    render(<NixeloLogo />);

    const svg = screen.getByRole("img", { name: "Nixelo Logo" });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "28");
    expect(svg).toHaveAttribute("height", "28");
  });

  it("renders with custom size", () => {
    render(<NixeloLogo size={64} />);

    const svg = screen.getByRole("img", { name: "Nixelo Logo" });
    expect(svg).toHaveAttribute("width", "64");
  });

  it("applies custom className", () => {
    render(<NixeloLogo className="my-class" />);

    const svg = screen.getByRole("img", { name: "Nixelo Logo" });
    expect(svg).toHaveClass("my-class");
  });
});
