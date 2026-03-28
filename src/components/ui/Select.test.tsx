import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Flex } from "./Flex";
import { Select } from "./Select";

describe("Select", () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => undefined;
    Element.prototype.setPointerCapture ??= () => undefined;
    Element.prototype.scrollIntoView ??= () => undefined;
  });

  it("renders grouped options and updates the selected value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Select<string>
        ariaLabel="Food"
        groups={[
          {
            label: "Fruits",
            options: [
              { value: "apple", label: "Apple" },
              { value: "banana", label: "Banana" },
            ],
          },
          {
            label: "Vegetables",
            options: [{ value: "carrot", label: "Carrot" }],
          },
        ]}
        onChange={onChange}
        placeholder="Select food"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Food" }));

    expect(await screen.findByText("Fruits")).toBeInTheDocument();
    expect(screen.getByText("Vegetables")).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Banana" }));

    expect(onChange).toHaveBeenCalledWith("banana");
    expect(screen.getByRole("combobox", { name: "Food" })).toHaveTextContent("Banana");
  });

  it("supports custom option rows and selected-value rendering", async () => {
    const user = userEvent.setup();

    render(
      <Select
        ariaLabel="Assignee"
        options={[
          { value: "alex", label: "Alex Morgan", team: "Platform" },
          { value: "jules", label: "Jules Ortiz", team: "Design" },
        ]}
        placeholder="Assign owner"
        renderOption={(option) => (
          <Flex align="center" gap="sm">
            <span>{option.label}</span>
            <span>{option.team}</span>
          </Flex>
        )}
        renderValue={(option) => `${option.label} · ${option.team}`}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Assignee" }));
    await user.click(await screen.findByRole("option", { name: /Jules Ortiz/i }));

    expect(screen.getByRole("combobox", { name: "Assignee" })).toHaveTextContent(
      "Jules Ortiz · Design",
    );
  });

  it("supports empty-string option values without falling back to the placeholder", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Select
        ariaLabel="Project"
        onChange={onChange}
        options={[
          { value: "", label: "No project" },
          { value: "alpha", label: "Alpha" },
        ]}
        placeholder="Select project"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Project" }));
    await user.click(await screen.findByRole("option", { name: "No project" }));

    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.getByRole("combobox", { name: "Project" })).toHaveTextContent("No project");
  });
});
