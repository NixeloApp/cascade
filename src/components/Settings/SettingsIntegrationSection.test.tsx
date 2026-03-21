import { describe, expect, it } from "vitest";
import { Github } from "@/lib/icons";
import { render, screen } from "@/test/custom-render";
import { Button } from "../ui/Button";
import {
  SettingsIntegrationInset,
  SettingsIntegrationMeta,
  SettingsIntegrationSection,
} from "./SettingsIntegrationSection";

describe("SettingsIntegrationSection", () => {
  it("renders shared integration heading, status, summary, and body content", () => {
    render(
      <SettingsIntegrationSection
        title="GitHub"
        description="Link repositories and pull request context."
        icon={Github}
        status={{ label: "Connected", variant: "success" }}
        summary={
          <SettingsIntegrationMeta label="Connected account">
            <div>@octocat</div>
          </SettingsIntegrationMeta>
        }
        action={<Button>Disconnect</Button>}
      >
        <SettingsIntegrationInset>Repositories body</SettingsIntegrationInset>
      </SettingsIntegrationSection>,
    );

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Connected account")).toBeInTheDocument();
    expect(screen.getByText("@octocat")).toBeInTheDocument();
    expect(screen.getByText("Repositories body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();
  });
});
