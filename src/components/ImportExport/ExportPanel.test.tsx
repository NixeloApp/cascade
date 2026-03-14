import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { ExportPanel } from "./ExportPanel";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedQuery: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

const mockUseAuthenticatedQuery = vi.mocked(useAuthenticatedQuery);

describe("ExportPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows filtered export copy when sprint or status filters are active", () => {
    mockUseAuthenticatedQuery.mockReturnValue(undefined);

    render(
      <ExportPanel
        projectId={"project_1" as Id<"projects">}
        sprintId={"sprint_1" as Id<"sprints">}
        status="in_progress"
      />,
    );

    expect(screen.getByText("Select Export Format")).toBeInTheDocument();
    expect(screen.getByText("Filtered issues will be exported.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export as CSV/i })).toBeInTheDocument();
  });

  it("exports CSV data successfully", async () => {
    const user = userEvent.setup();
    let csvResponse: string | undefined;
    let jsonResponse: string | undefined;
    let queryCallIndex = 0;

    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      const isCsvCall = queryCallIndex % 2 === 0;
      queryCallIndex += 1;

      if (args === "skip") return undefined;
      return isCsvCall ? csvResponse : jsonResponse;
    });

    vi.spyOn(Date.prototype, "toISOString").mockReturnValue("2026-03-14T12:00:00.000Z");

    render(<ExportPanel projectId={"project_1" as Id<"projects">} />);

    const originalCreateElement = document.createElement.bind(document);
    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    const appendedNode = document.createTextNode("");

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return mockLink as unknown as HTMLElement;
      }
      return originalCreateElement(tagName);
    });
    vi.spyOn(document.body, "appendChild").mockReturnValue(appendedNode);
    vi.spyOn(document.body, "removeChild").mockReturnValue(appendedNode);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:csv");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    csvResponse = "key,title\nAPP-1,Ship export tests";

    await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Issues exported successfully!");
    });
    expect(mockLink.download).toBe("issues-export-2026-03-14.csv");
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv");
  });

  it("shows an error when JSON export resolves with no data", async () => {
    const user = userEvent.setup();
    let csvResponse: string | undefined;
    let jsonResponse: string | undefined;
    let queryCallIndex = 0;

    mockUseAuthenticatedQuery.mockImplementation((_query, args) => {
      const isCsvCall = queryCallIndex % 2 === 0;
      queryCallIndex += 1;

      if (args === "skip") return undefined;
      return isCsvCall ? csvResponse : jsonResponse;
    });

    render(<ExportPanel projectId={"project_1" as Id<"projects">} />);

    await user.click(screen.getByText("JSON"));
    jsonResponse = "   ";

    await user.click(screen.getByRole("button", { name: /Export as JSON/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(expect.any(Error), "Export Failed");
    });
    const errorArg = vi.mocked(showError).mock.calls[0]?.[0];
    expect(errorArg).toBeInstanceOf(Error);
    expect((errorArg as Error).message).toBe("No data to export");
    expect(showSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Export as JSON/i })).not.toBeDisabled();
  });
});
