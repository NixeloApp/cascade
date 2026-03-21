import { describe, expect, it } from "vitest";
import { Bell } from "@/lib/icons";
import { render, screen } from "@/test/custom-render";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { SettingsSection, SettingsSectionRow } from "./SettingsSection";

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
});
