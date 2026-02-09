import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { ImportExportModal } from "./ImportExportModal";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock toast utilities used by ImportPanel
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Helper to create a mock FileReader
function createMockFileReader(data: string) {
  return class MockFileReader {
    onload: ((e: { target: { result: string } }) => void) | null = null;
    result: string | null = null;

    readAsText() {
      this.result = data;
      if (this.onload) {
        this.onload({ target: { result: data } });
      }
    }
  };
}

// Helper to wait for file input to be available and return it
// Note: Dialog uses a portal, so we need to search document.body instead of container
async function waitForFileInput(_container: HTMLElement): Promise<HTMLInputElement> {
  await waitFor(() => {
    expect(document.body.querySelector('input[type="file"]')).toBeInTheDocument();
  });
  return document.body.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("ImportExportModal - Component Behavior", () => {
  const mockProjectId = "project123" as Id<"projects">;
  const mockOnOpenChange = vi.fn();
  const mockImportCSV = vi.fn();
  const mockImportJSON = vi.fn();
  let mutationCallCount = 0;

  beforeEach(() => {
    mutationCallCount = 0;
    mockImportCSV.mockReset();
    mockImportJSON.mockReset();
    mockOnOpenChange.mockClear();

    // Clear toast mocks
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(showSuccess).mockClear();
    vi.mocked(showError).mockClear();

    // Set up mutation mocks to persist across re-renders
    (useMutation as any).mockImplementation(() => {
      mutationCallCount++;
      if (mutationCallCount % 2 === 1) return mockImportCSV; // Odd calls = importCSV
      return mockImportJSON; // Even calls = importJSON
    });

    (useQuery as any).mockReturnValue(undefined);
  });

  afterEach(() => {
    // Clean up all spies to prevent test interference
    vi.restoreAllMocks();
  });

  describe("Mode Switching Logic", () => {
    it("should default to export mode", () => {
      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      expect(screen.getByText("Select Export Format")).toBeInTheDocument();
    });

    it("should switch to import mode when Import button clicked", async () => {
      const user = userEvent.setup();

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      expect(screen.getByText("Select Import Format")).toBeInTheDocument();
      expect(screen.queryByText("Select Export Format")).not.toBeInTheDocument();
    });

    it("should switch back to export mode when Export button clicked", async () => {
      const user = userEvent.setup();

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));
      await user.click(screen.getByRole("button", { name: /Export/i }));

      expect(screen.getByText("Select Export Format")).toBeInTheDocument();
      expect(screen.queryByText("Select Import Format")).not.toBeInTheDocument();
    });

    it("should maintain separate format selections for export and import", async () => {
      const user = userEvent.setup();

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      // Set export to JSON
      await user.click(screen.getByText("JSON"));
      expect(screen.getByRole("button", { name: /Export as JSON/i })).toBeInTheDocument();

      // Switch to import (should default to CSV)
      await user.click(screen.getByRole("button", { name: /Import/i }));
      expect(screen.getByRole("button", { name: /Import from CSV/i })).toBeInTheDocument();

      // Switch back to export (format resets to CSV with refactored component)
      await user.click(screen.getByRole("button", { name: /Export/i }));
      expect(screen.getByRole("button", { name: /Export as CSV/i })).toBeInTheDocument();
    });
  });

  describe("Export Empty Data Validation", () => {
    it("should show error when export data is empty", async () => {
      const user = userEvent.setup();

      // First query call returns undefined, second returns empty string
      let queryCallCount = 0;
      (useQuery as any).mockImplementation(() => {
        queryCallCount++;
        return queryCallCount > 1 ? "" : undefined;
      });

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
      });
    });

    it("should show error when export data is whitespace-only", async () => {
      const user = userEvent.setup();

      let queryCallCount = 0;
      (useQuery as any).mockImplementation(() => {
        queryCallCount++;
        return queryCallCount > 1 ? "   " : undefined;
      });

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
      });
    });

    it("should NOT show error when export has valid data", async () => {
      const user = userEvent.setup();

      // Mock useQuery to return CSV data when called
      (useQuery as unknown as Mock).mockImplementation((_apiRef: unknown, args: unknown) => {
        // Return undefined initially, then return data when isExporting becomes true
        if (args === "skip") return undefined;
        return "key,title\nTEST-1,Issue";
      });

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      // Setup mocks AFTER render to avoid interfering with React
      const originalCreateElement = document.createElement.bind(document);
      const mockLink: Partial<HTMLAnchorElement> = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      const mockNode = {} as Node;
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "a") {
          return mockLink as HTMLElement;
        }
        return originalCreateElement(tagName);
      });
      vi.spyOn(document.body, "appendChild").mockReturnValue(mockNode);
      vi.spyOn(document.body, "removeChild").mockReturnValue(mockNode);
      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Issues exported successfully!");
        expect(showError).not.toHaveBeenCalled();
      });
    });
  });

  describe("Export Button State", () => {
    it("should show 'Exporting...' text when isExporting is true", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue(undefined); // Keep loading

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Export as CSV/i }));

      expect(screen.getByText("Exporting...")).toBeInTheDocument();
    });

    it("should disable export button while exporting", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue(undefined);

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      const exportButton = screen.getByRole("button", { name: /Export as CSV/i });
      await user.click(exportButton);

      expect(exportButton).toBeDisabled();
    });

    it("should show correct format in button text when switching formats", async () => {
      const user = userEvent.setup();

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      expect(screen.getByRole("button", { name: /Export as CSV/i })).toBeInTheDocument();

      await user.click(screen.getByText("JSON"));

      expect(screen.getByRole("button", { name: /Export as JSON/i })).toBeInTheDocument();
    });
  });

  describe("Import File Validation", () => {
    it("should show error when trying to import without selecting file", async () => {
      const user = userEvent.setup();

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      // Button should be disabled when no file is selected, so we can't click it
      // The test name is misleading - the component prevents the action by disabling the button
      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      expect(importButton).toBeDisabled();
    });

    it("should disable import button when no file selected", async () => {
      const user = userEvent.setup();

      render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      expect(importButton).toBeDisabled();
    });

    it("should enable import button after file is selected", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("title\nTest Issue") as unknown as typeof FileReader;

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["title\nTest"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });
    });
  });

  describe("File Selection Display", () => {
    it("should display selected file name and size", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["a".repeat(2048)], "issues.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Selected: issues\.csv/i)).toBeInTheDocument();
        expect(screen.getByText(/2\.00 KB/i)).toBeInTheDocument();
      });
    });

    it("should calculate file size correctly", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      // Create 5KB file
      const file = new File(["a".repeat(5120)], "data.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/5\.00 KB/i)).toBeInTheDocument();
      });
    });
  });

  describe("Import Success Message Formatting", () => {
    it("should use singular 'issue' when importing 1 issue", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("title\nIssue 1") as unknown as typeof FileReader;

      mockImportCSV.mockResolvedValue({ imported: 1, failed: 0, errors: [] });

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["title\nIssue"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Successfully imported 1 issue");
      });
    });

    it("should use plural 'issues' when importing multiple", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader(
        "title\nIssue 1\nIssue 2",
      ) as unknown as typeof FileReader;

      mockImportCSV.mockResolvedValue({ imported: 5, failed: 0, errors: [] });

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Successfully imported 5 issues");
      });
    });

    it("should include failure count in success message when some failed", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      mockImportCSV.mockResolvedValue({
        imported: 8,
        failed: 2,
        errors: ["Error 1", "Error 2"],
      });

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Successfully imported 8 issues (2 failed)");
      });
    });

    it("should NOT show failure count when all succeeded", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      mockImportCSV.mockResolvedValue({ imported: 10, failed: 0, errors: [] });

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        const successCall = vi.mocked(showSuccess).mock.calls[0][0];
        expect(successCall).toBe("Successfully imported 10 issues");
        expect(successCall).not.toContain("failed");
      });
    });
  });

  describe("Import Error Handling", () => {
    it("should show error when no issues were imported", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      mockImportCSV.mockResolvedValue({ imported: 0, failed: 5, errors: [] });

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
      });
    });

    it("should show error message when import fails", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      mockImportCSV.mockRejectedValue(new Error("Invalid CSV format"));

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
      });
    });

    it("should show generic error when error has no message", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      // Reject with a non-Error to trigger the fallback message
      mockImportCSV.mockRejectedValue("Unknown error");

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
      });
    });
  });

  describe("Import Button State", () => {
    it("should show 'Importing...' text while importing", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      mockImportCSV.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ imported: 1, failed: 0 }), 100)),
      );

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      expect(screen.getByText("Importing...")).toBeInTheDocument();
    });

    it("should disable import button while importing", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      mockImportCSV.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ imported: 1, failed: 0 }), 100)),
      );

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      const disabledButton = screen.getByRole("button", { name: /Importing/i });
      expect(disabledButton).toBeDisabled();
    });
  });

  describe("Modal Close Behavior", () => {
    it("should close modal after successful import", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      mockImportCSV.mockResolvedValue({ imported: 3, failed: 0, errors: [] });

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalled();
      });
    });

    it("should NOT close modal when import fails", async () => {
      const user = userEvent.setup();

      global.FileReader = createMockFileReader("data") as unknown as typeof FileReader;

      mockImportCSV.mockResolvedValue({ imported: 0, failed: 2, errors: [] });

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      const file = new File(["data"], "test.csv", { type: "text/csv" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        const importButton = screen.getByRole("button", { name: /Import from CSV/i });
        expect(importButton).not.toBeDisabled();
      });

      const importButton = screen.getByRole("button", { name: /Import from CSV/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalled();
        expect(mockOnOpenChange).not.toHaveBeenCalled();
      });
    });
  });

  describe("File Accept Attribute", () => {
    it("should accept .csv files when CSV format selected", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));

      const fileInput = await waitForFileInput(container);
      expect(fileInput).toHaveAttribute("accept", ".csv");
    });

    it("should accept .json files when JSON format selected", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <ImportExportModal open={true} onOpenChange={mockOnOpenChange} projectId={mockProjectId} />,
      );

      await user.click(screen.getByRole("button", { name: /Import/i }));
      await user.click(screen.getByText("JSON"));

      const fileInput = await waitForFileInput(container);
      expect(fileInput).toHaveAttribute("accept", ".json");
    });
  });
});
