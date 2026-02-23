import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

describe("RadioGroup", () => {
  it("renders correctly with default props", () => {
    render(
      <RadioGroup defaultValue="1">
        <RadioGroupItem value="1" label="Option 1" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio", { name: "Option 1" })).toBeInTheDocument();
  });

  it("renders with a description", () => {
    render(
      <RadioGroup defaultValue="1">
        <RadioGroupItem value="1" label="Option 1" description="This is option 1" />
      </RadioGroup>,
    );
    expect(screen.getByText("This is option 1")).toBeInTheDocument();
  });

  it("associates description via aria-describedby", () => {
    render(
      <RadioGroup defaultValue="1">
        <RadioGroupItem value="1" label="Option 1" description="This is option 1" />
      </RadioGroup>,
    );

    const radio = screen.getByRole("radio", { name: "Option 1" });
    const descriptionElement = screen.getByText("This is option 1");

    // The description element should have an ID
    expect(descriptionElement).toHaveAttribute("id");
    const descriptionId = descriptionElement.getAttribute("id");

    // ID should not be null
    expect(descriptionId).toBeTruthy();

    if (!descriptionId) {
      throw new Error("Description ID should be present");
    }

    // The radio should point to the description ID
    expect(radio).toHaveAttribute("aria-describedby", expect.stringContaining(descriptionId));
  });
});
