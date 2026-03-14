import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { ImportPanel } from "./ImportPanel";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);

const importCsv = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const importJson = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;

function createMockFileReader(data: string) {
  return class MockFileReader {
    onload: ((event: { target: { result: string } }) => void) | null = null;

    readAsText() {
      this.onload?.({ target: { result: data } });
    }
  };
}

function installMockFileReader(data: string) {
  vi.stubGlobal("FileReader", createMockFileReader(data));
}

describe("ImportPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationIndex = 0;
    mockUseAuthenticatedMutation.mockImplementation(() =>
      mutationIndex++ % 2 === 0
        ? { mutate: importCsv, canAct: true, isAuthLoading: false }
        : { mutate: importJson, canAct: true, isAuthLoading: false },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows CSV import requirements and enables import after file selection", async () => {
    const user = userEvent.setup();
    installMockFileReader("title\nFirst issue");

    render(<ImportPanel projectId={"project_1" as Id<"projects">} />);

    expect(screen.getByText("Select Import Format")).toBeInTheDocument();
    expect(screen.getByText("CSV must have a header row with column names.")).toBeInTheDocument();

    const fileInput = screen.getByLabelText("Select File");
    const file = new File(["title\nFirst issue"], "issues.csv", { type: "text/csv" });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/Selected: issues\.csv/)).toBeInTheDocument();
    });
    expect(screen.getByText(/0\.02 KB/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import from CSV/i })).not.toBeDisabled();
  });

  it("imports CSV successfully and resets the selected file state", async () => {
    const user = userEvent.setup();
    installMockFileReader("title\nImported issue");
    importCsv.mockResolvedValue({ imported: 2, failed: 1, errors: [] });
    const onImportComplete = vi.fn();

    render(
      <ImportPanel projectId={"project_1" as Id<"projects">} onImportComplete={onImportComplete} />,
    );

    const file = new File(["title\nImported issue"], "import.csv", { type: "text/csv" });
    await user.upload(screen.getByLabelText("Select File"), file);
    await user.click(screen.getByRole("button", { name: /Import from CSV/i }));

    await waitFor(() => {
      expect(importCsv).toHaveBeenCalledWith({
        projectId: "project_1",
        csvData: "title\nImported issue",
      });
    });
    expect(showSuccess).toHaveBeenCalledWith("Successfully imported 2 issues (1 failed)");
    expect(onImportComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Selected: import\.csv/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import from CSV/i })).toBeDisabled();
  });

  it("switches to JSON imports and shows an error when nothing is imported", async () => {
    const user = userEvent.setup();
    installMockFileReader('{"title":"Imported issue"}');
    importJson.mockResolvedValue({ imported: 0, failed: 1, errors: [] });

    render(<ImportPanel projectId={"project_1" as Id<"projects">} />);

    await user.click(screen.getByText("JSON"));
    expect(screen.getByLabelText("Select File")).toHaveAttribute("accept", ".json");

    const file = new File(['{"title":"Imported issue"}'], "import.json", {
      type: "application/json",
    });
    await user.upload(screen.getByLabelText("Select File"), file);
    await user.click(screen.getByRole("button", { name: /Import from JSON/i }));

    await waitFor(() => {
      expect(importJson).toHaveBeenCalledWith({
        projectId: "project_1",
        jsonData: '{"title":"Imported issue"}',
      });
    });
    expect(showError).toHaveBeenCalledWith(expect.any(Error), "Import Failed");
    const errorArg = vi.mocked(showError).mock.calls[0]?.[0];
    expect(errorArg).toBeInstanceOf(Error);
    expect((errorArg as Error).message).toBe("No issues were imported");
    expect(showSuccess).not.toHaveBeenCalled();
  });
});
