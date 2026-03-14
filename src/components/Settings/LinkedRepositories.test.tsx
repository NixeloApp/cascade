import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { toast } from "sonner";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor, within } from "@/test/custom-render";
import { LinkedRepositories } from "./LinkedRepositories";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

interface SelectContextValue {
  onValueChange: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

vi.mock("@convex/_generated/api", () => ({
  api: {
    projects: {
      getCurrentUserProjects: "projects.getCurrentUserProjects",
    },
    github: {
      listRepositories: "github.listRepositories",
      unlinkRepository: "github.unlinkRepository",
    },
  },
}));

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
  },
}));

vi.mock("../ui/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
  }: ConfirmDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <div>{message}</div>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    ) : null,
}));

vi.mock("../ui/Select", () => ({
  Select: ({
    children,
    onValueChange,
  }: {
    children: ReactNode;
    onValueChange: (value: string) => void;
  }) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => {
    const context = useContext(SelectContext);
    if (!context) {
      throw new Error("SelectItem used outside Select");
    }
    return (
      <button type="button" onClick={() => context.onValueChange(value)}>
        {children}
      </button>
    );
  },
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);
const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);
const mockShowError = vi.mocked(showError);
const mockShowSuccess = vi.mocked(showSuccess);
const mockToastInfo = vi.mocked(toast.info);

const mockUnlinkRepository = Object.assign(vi.fn(), {
  withOptimisticUpdate: vi.fn().mockReturnThis(),
}) as Mock & ReactMutation<FunctionReference<"mutation">>;

const firstProjectId = "project-1" as Id<"projects">;
const secondProjectId = "project-2" as Id<"projects">;
const firstRepoId = "repo-1" as Id<"githubRepositories">;

const projects = [
  {
    _id: firstProjectId,
    name: "Apollo",
    key: "APL",
  },
  {
    _id: secondProjectId,
    name: "Borealis",
    key: "BOR",
  },
] as Doc<"projects">[];

const repositoriesByProject: Record<string, Doc<"githubRepositories">[]> = {
  [firstProjectId]: [
    {
      _id: firstRepoId,
      repoFullName: "nixelo/apollo",
      syncPRs: true,
      autoLinkCommits: true,
    },
  ] as Doc<"githubRepositories">[],
  [secondProjectId]: [],
};

describe("LinkedRepositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticatedMutation.mockReturnValue({
      mutate: mockUnlinkRepository,
      canAct: true,
      isAuthLoading: false,
    });
    mockUseAuthenticatedQuery.mockImplementation((reference, args) => {
      if (reference === api.projects.getCurrentUserProjects) {
        return { page: projects };
      }

      if (reference === api.github.listRepositories) {
        if (args === "skip") {
          return undefined;
        }
        return repositoriesByProject[args.projectId] ?? [];
      }

      return null;
    });
  });

  it("shows linked repositories after a project is selected", async () => {
    const user = userEvent.setup();

    render(<LinkedRepositories />);

    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(api.github.listRepositories, "skip");
    expect(screen.queryByText("nixelo/apollo")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Apollo (APL)" }));

    expect(await screen.findByText("nixelo/apollo")).toBeInTheDocument();
    expect(screen.getByText(/PRs\s+•\s+Auto-link commits/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Link New Repository" })).toBeInTheDocument();

    await waitFor(() =>
      expect(mockUseAuthenticatedQuery).toHaveBeenLastCalledWith(api.github.listRepositories, {
        projectId: firstProjectId,
      }),
    );
  });

  it("renders the empty state and link toast for projects without repositories", async () => {
    const user = userEvent.setup();

    render(<LinkedRepositories />);

    await user.click(screen.getByRole("button", { name: "Borealis (BOR)" }));

    expect(
      await screen.findByText("No repositories linked to this project yet."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Link New Repository" }));

    expect(mockToastInfo).toHaveBeenCalledWith("Repository linking UI coming soon");
  });

  it("unlinks a repository after confirmation", async () => {
    const user = userEvent.setup();
    mockUnlinkRepository.mockResolvedValue(undefined);

    render(<LinkedRepositories />);

    await user.click(screen.getByRole("button", { name: "Apollo (APL)" }));
    await user.click(await screen.findByRole("button", { name: "Unlink nixelo/apollo" }));

    const dialog = screen.getByRole("dialog", { name: "Unlink Repository" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to unlink this repository?"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Unlink" }));

    await waitFor(() =>
      expect(mockUnlinkRepository).toHaveBeenCalledWith({
        repositoryId: firstRepoId,
      }),
    );

    expect(mockShowSuccess).toHaveBeenCalledWith("Repository unlinked");
    expect(mockShowError).not.toHaveBeenCalled();
  });
});
