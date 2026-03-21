import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AuthMethodDivider } from "./AuthMethodDivider";

describe("AuthMethodDivider", () => {
  it("renders the default divider label", () => {
    render(<AuthMethodDivider />);

    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("renders a custom divider label", () => {
    render(<AuthMethodDivider label="and" />);

    expect(screen.getByText("and")).toBeInTheDocument();
  });
});
