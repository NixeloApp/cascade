import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/custom-render";
import { Command } from "./Command";
import { Typography } from "./Typography";

describe("Command", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders header, content sections, footer, and dispatches item selection", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <Command
        footer={<Typography>Footer actions</Typography>}
        header={<Typography>Header content</Typography>}
        search={{
          placeholder: "Search commands",
          value: "",
          onValueChange: vi.fn(),
          ariaLabel: "Command search",
        }}
        sections={[
          {
            type: "content",
            id: "intro",
            content: <Typography>Intro panel</Typography>,
          },
          {
            id: "actions",
            heading: "Actions",
            items: [
              {
                value: "create-issue",
                onSelect: handleSelect,
                render: <Typography>Create Issue</Typography>,
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("Command search")).toHaveAttribute(
      "placeholder",
      "Search commands",
    );
    expect(screen.getByText("Header content")).toBeInTheDocument();
    expect(screen.getByText("Intro panel")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Footer actions")).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Create Issue" }));

    expect(handleSelect).toHaveBeenCalledWith("create-issue");
  });

  it("shows the wrapper-owned empty state when filtering removes all items", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [query, setQuery] = useState("");

      return (
        <Command
          emptyMessage="No matches"
          filter={(value, search) => (value.includes(search) ? 1 : 0)}
          search={{
            placeholder: "Filter commands",
            value: query,
            onValueChange: setQuery,
            ariaLabel: "Filter commands",
          }}
          sections={[
            {
              id: "commands",
              items: [
                {
                  value: "alpha",
                  render: <Typography>Alpha</Typography>,
                },
              ],
            },
          ]}
        />
      );
    }

    render(<Harness />);

    expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Filter commands"), "zzz");

    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Alpha" })).not.toBeInTheDocument();
  });
});
