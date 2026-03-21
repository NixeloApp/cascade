import { describe, expect, it } from "vitest";
import { AtSign, Bell } from "@/lib/icons";
import { render, screen } from "@/test/custom-render";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { SettingsSection, SettingsSectionInset, SettingsSectionRow } from "./SettingsSection";

describe("SettingsSection", () => {
  it("renders the shared section header with icon, description, and action", () => {
    render(
      <SettingsSection
        title="Notifications"
        description="Keep alerts consistent across channels."
        icon={Bell}
        titleAdornment={<Badge variant="info">PWA</Badge>}
        action={<Button>Manage</Button>}
      >
        <div>Section body</div>
      </SettingsSection>,
    );

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Keep alerts consistent across channels.")).toBeInTheDocument();
    expect(screen.getByText("PWA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage" })).toBeInTheDocument();
    expect(screen.getByText("Section body")).toBeInTheDocument();
  });
});

describe("SettingsSectionRow", () => {
  it("renders the shared row title, description, and action slot", () => {
    render(
      <SettingsSectionRow
        title="Timezone"
        description="Use a specific timezone for timestamps."
        action={<Button>Change</Button>}
      />,
    );

    expect(screen.getByText("Timezone")).toBeInTheDocument();
    expect(screen.getByText("Use a specific timezone for timestamps.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
  });

  it("renders an optional leading icon", () => {
    const { container } = render(
      <SettingsSectionRow
        title="Mentions"
        description="Get notified when someone mentions you."
        icon={AtSign}
      />,
    );

    expect(screen.getByText("Mentions")).toBeInTheDocument();
    expect(screen.getByText("Get notified when someone mentions you.")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("SettingsSectionInset", () => {
  it("renders the shared inset title, description, and action slot", () => {
    render(
      <SettingsSectionInset
        title="Review filters"
        description="Focus the list before taking action."
        action={<Button>Clear</Button>}
      >
        <div>Inset body</div>
      </SettingsSectionInset>,
    );

    expect(screen.getByText("Review filters")).toBeInTheDocument();
    expect(screen.getByText("Focus the list before taking action.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(screen.getByText("Inset body")).toBeInTheDocument();
  });
});
