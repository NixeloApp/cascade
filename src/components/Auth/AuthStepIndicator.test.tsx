import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AuthStepIndicator } from "./AuthStepIndicator";

describe("AuthStepIndicator", () => {
  it("renders one pill per step and marks completed progress", () => {
    const { container } = render(<AuthStepIndicator currentStep={1} totalSteps={3} />);

    expect(screen.getByLabelText("Authentication progress")).toBeInTheDocument();

    const pills = container.querySelectorAll("span[aria-hidden='true']");
    expect(pills).toHaveLength(3);
    expect(pills[0]).toHaveClass("w-6", "bg-brand");
    expect(pills[1]).toHaveClass("w-6", "bg-brand");
    expect(pills[2]).toHaveClass("w-4", "bg-ui-border");
  });
});
