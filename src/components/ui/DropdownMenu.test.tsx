import { describe, expect, it } from "vitest";
import { Settings } from "@/lib/icons";
import { render, screen } from "@/test/custom-render";
import {
  DropdownMenu,
  DropdownMenuContent,
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
});
