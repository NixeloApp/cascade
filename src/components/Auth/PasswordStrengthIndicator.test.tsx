import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

vi.mock("zxcvbn", () => ({
  default: (password: string) => {
    if (password.length < 4) return { score: 0, feedback: { warning: "Too short" } };
    if (password.length < 8) return { score: 1, feedback: {} };
    if (password.length < 12) return { score: 2, feedback: {} };
    if (password.length < 16) return { score: 3, feedback: {} };
    return { score: 4, feedback: {} };
  },
}));

vi.mock("@/components/ui/Card", () => ({
  Card: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

describe("PasswordStrengthIndicator", () => {
  it("renders nothing when password is empty", () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);

    expect(container.firstChild).toBeNull();
  });

  it("shows Very weak for short passwords", async () => {
    render(<PasswordStrengthIndicator password="ab" />);

    await waitFor(() => {
      expect(screen.getByText("Very weak")).toBeInTheDocument();
    });
  });

  it("shows Strong for long passwords", async () => {
    render(<PasswordStrengthIndicator password="thisIsAVeryLongPassword123!" />);

    await waitFor(() => {
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });
  });

  it("displays feedback warning when present", async () => {
    render(<PasswordStrengthIndicator password="ab" />);

    await waitFor(() => {
      expect(screen.getByText("Too short")).toBeInTheDocument();
    });
  });
});
