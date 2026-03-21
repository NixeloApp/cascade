import { describe, expect, it } from "vitest";
import { Mail } from "@/lib/icons";
import { render, screen } from "@/test/custom-render";
import { AuthFlowIntro } from "./AuthFlowIntro";

describe("AuthFlowIntro", () => {
  it("renders icon-backed intro copy", () => {
    render(
      <AuthFlowIntro
        icon={Mail}
        title="Verify your email"
        description="We sent a verification code."
      />,
    );

    expect(screen.getByText("Verify your email")).toBeInTheDocument();
    expect(screen.getByText("We sent a verification code.")).toBeInTheDocument();
  });
});
