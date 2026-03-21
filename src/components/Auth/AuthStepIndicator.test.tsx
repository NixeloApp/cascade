import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/custom-render";
import { AuthStepIndicator } from "./AuthStepIndicator";

describe("AuthStepIndicator", () => {
  it("renders one segment per step", () => {
    render(<AuthStepIndicator currentStep={1} totalSteps={4} />);

    const progress = screen.getByLabelText("Authentication progress");

    expect(progress).toBeInTheDocument();
    expect(progress.childElementCount).toBe(4);
  });
});
