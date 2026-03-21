import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/custom-render";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
} from "./Popover";

describe("Popover", () => {
  it("supports slot-based overlay anatomy without shell padding drift", () => {
    render(
      <Popover open={true}>
        <PopoverContent padding="none" data-testid="popover-content">
          <PopoverHeader>
            <PopoverTitle as="h3">Create label</PopoverTitle>
            <PopoverDescription>Choose a label name and color.</PopoverDescription>
          </PopoverHeader>
          <PopoverBody>
            <p>Label form body</p>
          </PopoverBody>
          <PopoverFooter>
            <button type="button">Cancel</button>
            <button type="button">Create</button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>,
    );

    expect(screen.getByTestId("popover-content")).toHaveClass("p-0");
    expect(screen.getByRole("heading", { name: "Create label" })).toBeInTheDocument();
    expect(screen.getByText("Choose a label name and color.")).toBeInTheDocument();
    expect(screen.getByText("Label form body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });
});
