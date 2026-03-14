import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { render, renderHook, screen } from "@/test/custom-render";
import { type CommandAction, CommandPalette, useCommands } from "./CommandPalette";

let latestFilter: ((value: string, search: string) => number) | undefined;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/hooks/useOrgContext", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("./ui/Command", () => ({
  CommandDialog: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
  Command: ({
    children,
    filter,
  }: {
    children: ReactNode;
    filter?: (value: string, search: string) => number;
  }) => {
    latestFilter = filter;
    return <div>{children}</div>;
  },
  CommandInput: ({
    value,
    onValueChange,
    placeholder,
    "aria-label": ariaLabel,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    "aria-label"?: string;
  }) => (
    <input
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
    />
  ),
  CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ heading, children }: { heading: string; children: ReactNode }) => (
    <section aria-label={heading}>{children}</section>
  ),
  CommandItem: ({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) => (
    <button type="button" onClick={onSelect}>
      {children}
    </button>
  ),
}));

const mockUseNavigate = vi.mocked(useNavigate);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockUseOrganization = vi.mocked(useOrganization);
const mockNavigate = vi.fn();

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestFilter = undefined;
  });

  it("groups commands, closes after selection, and resets search when reopened", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const runCommand = vi.fn();
    const commands: CommandAction[] = [
      {
        id: "create-issue",
        label: "Create Issue",
        description: "Open the issue composer",
        keywords: ["new", "bug"],
        action: runCommand,
        group: "Create",
      },
      {
        id: "go-dashboard",
        label: "Go to Dashboard",
        description: "Open your dashboard",
        action: vi.fn(),
        group: "Navigation",
      },
    ];

    const { rerender } = render(<CommandPalette isOpen onClose={onClose} commands={commands} />);

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Issue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Go to Dashboard/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Command menu"), "issue");
    expect(screen.getByLabelText("Command menu")).toHaveValue("issue");

    await user.click(screen.getByRole("button", { name: /Create Issue/i }));
    expect(runCommand).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<CommandPalette isOpen={false} onClose={onClose} commands={commands} />);
    rerender(<CommandPalette isOpen onClose={onClose} commands={commands} />);

    expect(screen.getByLabelText("Command menu")).toHaveValue("");
  });

  it("matches commands by label, description, and keywords through the custom filter", () => {
    const commands: CommandAction[] = [
      {
        id: "create-issue",
        label: "Create Issue",
        description: "Open the issue composer",
        keywords: ["new", "bug"],
        action: vi.fn(),
        group: "Create",
      },
      {
        id: "open-docs",
        label: "Documents",
        description: "Browse pages",
        keywords: ["wiki"],
        action: vi.fn(),
        group: "Navigation",
      },
    ];

    render(<CommandPalette isOpen onClose={vi.fn()} commands={commands} />);

    expect(latestFilter?.("create-issue", "create")).toBe(1);
    expect(latestFilter?.("create-issue", "composer")).toBe(1);
    expect(latestFilter?.("create-issue", "bug")).toBe(1);
    expect(latestFilter?.("open-docs", "unknown")).toBe(0);
    expect(latestFilter?.("missing", "create")).toBe(0);
  });
});

describe("useCommands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseOrganization.mockReturnValue({
      organizationId: "org_1" as Id<"organizations">,
      orgSlug: "acme",
      organizationName: "Acme",
      userRole: "owner",
      billingEnabled: true,
    });
  });

  it("builds navigation, create, project, and recent issue commands", () => {
    const onCreateIssue = vi.fn();
    const onCreateDocument = vi.fn();
    const onCreateProject = vi.fn();

    mockUseAuthenticatedQuery
      .mockReturnValueOnce([
        {
          _id: "project_1" as Id<"projects">,
          key: "APP",
          name: "App Shell",
        },
      ])
      .mockReturnValueOnce({
        page: [
          {
            _id: "issue_1" as Id<"issues">,
            key: "APP-12",
            title: "Fix palette search",
            type: "bug",
            projectKey: "APP",
            projectName: "App Shell",
          },
        ],
      });

    const { result } = renderHook(() =>
      useCommands({ onCreateIssue, onCreateDocument, onCreateProject }),
    );

    const dashboardCommand = result.current.find((cmd) => cmd.id === "nav-dashboard");
    const projectCommand = result.current.find((cmd) => cmd.id === "project-project_1");
    const createIssueCommand = result.current.find((cmd) => cmd.id === "create-issue");
    const recentIssueCommand = result.current.find((cmd) => cmd.id === "issue-issue_1");

    expect(result.current.map((cmd) => cmd.group)).toContain("Navigation");
    expect(result.current.map((cmd) => cmd.group)).toContain("Projects");
    expect(result.current.map((cmd) => cmd.group)).toContain("Create");
    expect(result.current.map((cmd) => cmd.group)).toContain("Recent Issues");

    dashboardCommand?.action();
    projectCommand?.action();
    createIssueCommand?.action();
    recentIssueCommand?.action();

    expect(mockNavigate).toHaveBeenNthCalledWith(1, {
      to: ROUTES.dashboard.path,
      params: { orgSlug: "acme" },
    });
    expect(mockNavigate).toHaveBeenNthCalledWith(2, {
      to: ROUTES.projects.board.path,
      params: { orgSlug: "acme", key: "APP" },
    });
    expect(onCreateIssue).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenNthCalledWith(3, {
      to: ROUTES.projects.board.path,
      params: { orgSlug: "acme", key: "APP" },
    });
    expect(onCreateDocument).not.toHaveBeenCalled();
    expect(onCreateProject).not.toHaveBeenCalled();
  });

  it("omits optional create and data-driven commands when queries return nothing", () => {
    mockUseAuthenticatedQuery.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);

    const { result } = renderHook(() => useCommands());

    expect(result.current.map((cmd) => cmd.id)).toEqual([
      "nav-dashboard",
      "nav-documents",
      "nav-projects",
    ]);
  });
});
