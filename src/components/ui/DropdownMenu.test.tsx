import { describe, expect, it } from "vitest";
import { Settings } from "@/lib/icons";
import { render, screen } from "@/test/custom-render";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuDescription,
  DropdownMenuFooter,
  DropdownMenuHeader,
  DropdownMenuHeaderTitle,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { Icon } from "./Icon";

describe("DropdownMenuItem", () => {
  it("injects icon content for asChild items without forcing local spacing classes", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            asChild
            icon={<Icon icon={Settings} size="sm" data-testid="settings-icon" />}
          >
            <a href="/settings">Settings</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const link = screen.getByRole("menuitem", { name: "Settings" });

    expect(link).toHaveClass("flex");
    expect(link).toHaveClass("items-center");
    expect(link).toHaveAttribute("href", "/settings");
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
  });

  it("supports shared overlay header and footer chrome for richer menus", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuHeader>
            <DropdownMenuHeaderTitle as="div">Bulk actions</DropdownMenuHeaderTitle>
            <DropdownMenuDescription as="div">
              Run the same action across selected issues.
            </DropdownMenuDescription>
          </DropdownMenuHeader>
          <DropdownMenuItem>Assign</DropdownMenuItem>
          <DropdownMenuFooter>
            <button type="button">Done</button>
          </DropdownMenuFooter>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByText("Bulk actions")).toBeInTheDocument();
    expect(screen.getByText("Run the same action across selected issues.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });
});
