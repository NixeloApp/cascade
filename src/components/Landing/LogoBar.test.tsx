import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { LogoBar } from "./LogoBar";

describe("LogoBar", () => {
  it("renders the social-proof heading and every logo chip", () => {
    const { container } = render(<LogoBar />);

    expect(container.querySelector("section")).toBeInTheDocument();
    expect(
      screen.getByText("Inspired by the workflows modern product teams expect"),
    ).toBeInTheDocument();

    expect(screen.getByText("STRIPE")).toBeInTheDocument();
    expect(screen.getByText("VERCEL")).toBeInTheDocument();
    expect(screen.getByText("NOTION")).toBeInTheDocument();
    expect(screen.getByText("ANTHROPIC")).toBeInTheDocument();
    expect(screen.getByText("COINBASE")).toBeInTheDocument();
    expect(screen.getByText("PERPLEXITY")).toBeInTheDocument();
  });
});
