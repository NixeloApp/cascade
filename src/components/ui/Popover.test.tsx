import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/custom-render";
import { Popover } from "./Popover";
import { Typography } from "./Typography";

describe("Popover", () => {
  it("renders structured header, body, and footer chrome through the wrapper API", () => {
    render(
      <Popover
        bodyClassName="p-0"
        contentTestId="popover-content"
        footer={<button type="button">Create</button>}
        header={<Typography variant="label">Create label</Typography>}
        open={true}
        padding="none"
      >
        <Typography>Choose a label name and color.</Typography>
      </Popover>,
    );

    expect(screen.getByTestId("popover-content")).toHaveClass("p-0");
    expect(screen.getByText("Create label")).toBeInTheDocument();
    expect(screen.getByText("Choose a label name and color.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("supports anchored overlays and render-prop close handling", async () => {
    const user = userEvent.setup();

    render(
      <Popover
        anchor={<div data-testid="selection-anchor" />}
        className="w-auto"
        defaultOpen={true}
        footer={({ close }) => (
          <button type="button" onClick={close}>
            Done
          </button>
        )}
        recipe="floatingToolbar"
      >
        {({ open }) => <Typography>{open ? "Toolbar open" : "Toolbar closed"}</Typography>}
      </Popover>,
    );

    expect(screen.getByTestId("selection-anchor")).toBeInTheDocument();
    expect(screen.getByText("Toolbar open")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByText("Toolbar open")).not.toBeInTheDocument();
  });
});
