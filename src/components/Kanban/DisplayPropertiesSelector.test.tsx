import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  CARD_DISPLAY_LABELS,
  type CardDisplayOptions,
  DEFAULT_CARD_DISPLAY,
} from "@/lib/card-display-utils";
import { render, screen } from "@/test/custom-render";
import { DisplayPropertiesSelector } from "./DisplayPropertiesSelector";

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
}));

vi.mock("@/components/ui/DropdownMenu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuCheckboxItem: ({
    children,
    checked,
    onCheckedChange,
  }: {
    children: ReactNode;
    checked?: boolean;
    onCheckedChange?: () => void;
  }) => (
    <button type="button" onClick={onCheckedChange} aria-pressed={checked}>
      {children}
    </button>
  ),
}));

describe("DisplayPropertiesSelector", () => {
  it("shows the plain properties label when nothing is hidden", () => {
    render(<DisplayPropertiesSelector value={DEFAULT_CARD_DISPLAY} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /properties/i })).toHaveTextContent("Properties");
    expect(screen.queryByRole("button", { name: "Show All" })).not.toBeInTheDocument();
  });

  it("shows the visible count, toggles individual properties, and restores all hidden properties", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const partiallyHidden: CardDisplayOptions = {
      issueType: true,
      priority: false,
      labels: true,
      assignee: false,
      storyPoints: true,
    };

    render(<DisplayPropertiesSelector value={partiallyHidden} onChange={onChange} />);

    expect(screen.getByRole("button", { name: /properties/i })).toHaveTextContent("Properties (3)");

    await user.click(screen.getByRole("button", { name: CARD_DISPLAY_LABELS.issueType }));
    expect(onChange).toHaveBeenNthCalledWith(1, {
      issueType: false,
      priority: false,
      labels: true,
      assignee: false,
      storyPoints: true,
    });

    await user.click(screen.getByRole("button", { name: CARD_DISPLAY_LABELS.priority }));
    expect(onChange).toHaveBeenNthCalledWith(2, {
      issueType: true,
      priority: true,
      labels: true,
      assignee: false,
      storyPoints: true,
    });

    await user.click(screen.getByRole("button", { name: "Show All" }));
    expect(onChange).toHaveBeenNthCalledWith(3, DEFAULT_CARD_DISPLAY);
  });
});
