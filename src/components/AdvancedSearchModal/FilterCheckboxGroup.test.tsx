import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/custom-render";
import { FilterCheckboxGroup } from "./FilterCheckboxGroup";

vi.mock("../ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  getCardRecipeClassName: (recipe: string) => `recipe-${recipe}`,
}));

describe("FilterCheckboxGroup", () => {
  const options = ["bug", "feature", "task"] as const;

  it("renders label and all options", () => {
    render(
      <FilterCheckboxGroup
        label="Type"
        options={options}
        selectedValues={[]}
        onToggle={() => {}}
      />,
    );

    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("bug")).toBeInTheDocument();
    expect(screen.getByText("feature")).toBeInTheDocument();
    expect(screen.getByText("task")).toBeInTheDocument();
  });

  it("shows checked state for selected values", () => {
    render(
      <FilterCheckboxGroup
        label="Type"
        options={options}
        selectedValues={["bug", "task"]}
        onToggle={() => {}}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked(); // bug
    expect(checkboxes[1]).not.toBeChecked(); // feature
    expect(checkboxes[2]).toBeChecked(); // task
  });

  it("calls onToggle when checkbox is clicked", () => {
    const onToggle = vi.fn();

    render(
      <FilterCheckboxGroup
        label="Priority"
        options={["high", "medium", "low"]}
        selectedValues={[]}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByText("medium"));

    expect(onToggle).toHaveBeenCalledWith("medium");
  });

  it("uses custom renderLabel when provided", () => {
    render(
      <FilterCheckboxGroup
        label="Status"
        options={["open", "closed"]}
        selectedValues={[]}
        onToggle={() => {}}
        renderLabel={(opt) => <span data-testid={`label-${opt}`}>{opt.toUpperCase()}</span>}
      />,
    );

    expect(screen.getByTestId("label-open")).toHaveTextContent("OPEN");
    expect(screen.getByTestId("label-closed")).toHaveTextContent("CLOSED");
  });
});
