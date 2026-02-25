import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test/custom-render";
import { CustomFieldValues } from "./CustomFieldValues";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("CustomFieldValues - Component Behavior", () => {
  const mockIssueId = "issue123" as Id<"issues">;
  const mockProjectId = "project123" as Id<"projects">;
  const mockSetValue = vi.fn();
  const mockRemoveValue = vi.fn();

  // Helper to setup useQuery mocks that persist across re-renders
  const setupQueries = (
    customFieldsData: unknown,
    fieldValuesData: unknown,
    projectMembersData: unknown = [],
  ) => {
    let callCount = 0;
    (useQuery as any).mockImplementation(() => {
      // Queries in order: customFields, fieldValues, projectMembers
      // Pattern repeats for re-renders
      const queries = [customFieldsData, fieldValuesData, projectMembersData];
      return queries[callCount++ % 3];
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mutations to return in sequence for the 2 useMutation calls
    // Component creates: setValue, removeValue
    let mutationCallCount = 0;
    (useMutation as any).mockImplementation(() => {
      const mocks = [mockSetValue, mockRemoveValue];
      return mocks[mutationCallCount++ % 2];
    });

    // Default: no custom fields
    setupQueries([], []);
  });

  describe("Empty State & Visibility", () => {
    it("should not render when no custom fields exist", () => {
      setupQueries([], []);

      const { container } = render(
        <CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should not render when custom fields is undefined", () => {
      setupQueries(undefined, []);

      const { container } = render(
        <CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render when custom fields exist", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Customer ID",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      expect(screen.getByText("Custom Fields")).toBeInTheDocument();
      expect(screen.getByText("Customer ID")).toBeInTheDocument();
    });
  });

  describe("Value Trimming Logic", () => {
    it("should trim value before saving", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);
      mockSetValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.type(screen.getByRole("textbox"), "  value with spaces  ");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith({
          issueId: mockIssueId,
          fieldId: "field1",
          value: "value with spaces", // Trimmed!
        });
      });
    });

    it("should call removeValue when saving whitespace-only value", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);
      mockRemoveValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.type(screen.getByRole("textbox"), "     ");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockRemoveValue).toHaveBeenCalledWith({
          issueId: mockIssueId,
          fieldId: "field1",
        });
        expect(mockSetValue).not.toHaveBeenCalled();
      });
    });

    it("should call removeValue when saving empty value", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);
      mockRemoveValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      // Don't type anything, just save
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockRemoveValue).toHaveBeenCalled();
        expect(mockSetValue).not.toHaveBeenCalled();
      });
    });
  });

  describe("Edit Mode State Management", () => {
    it("should show 'Set' button when value is not set", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      expect(screen.getByRole("button", { name: /Set/i })).toBeInTheDocument();
    });

    it("should show 'Edit' button when value is set", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "Existing Value",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
    });

    it("should show edit form when Edit button clicked", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));

      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("should hide Set/Edit button when in edit mode", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));

      expect(screen.queryByRole("button", { name: /Set/i })).not.toBeInTheDocument();
    });

    it("should populate edit form with current value", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "Current Value",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      expect(screen.getByRole("textbox")).toHaveValue("Current Value");
    });

    it("should close edit mode when Cancel clicked", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.type(screen.getByRole("textbox"), "Some value");
      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Set/i })).toBeInTheDocument();
    });

    it("should close edit mode and clear form after successful save", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);
      mockSetValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.type(screen.getByRole("textbox"), "New value");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      });
    });
  });

  describe("Checkbox Field Logic", () => {
    it("should store checkbox as 'true' string when checked", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Is Verified",
          fieldType: "checkbox" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);
      mockSetValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith({
          issueId: mockIssueId,
          fieldId: "field1",
          value: "true",
        });
      });
    });

    it("should store checkbox as 'false' string when unchecked", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Is Verified",
          fieldType: "checkbox" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);
      mockSetValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      // Check then uncheck
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith({
          issueId: mockIssueId,
          fieldId: "field1",
          value: "false",
        });
      });
    });

    it("should display checked checkbox when value is 'true'", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Is Verified",
          fieldType: "checkbox" as const,
          isRequired: false,
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "true",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("should display unchecked checkbox when value is not 'true'", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Is Verified",
          fieldType: "checkbox" as const,
          isRequired: false,
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "false",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe("Multiselect Field Logic", () => {
    it("should add option to comma-separated value when checked", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Tags",
          fieldType: "multiselect" as const,
          isRequired: false,
          options: ["Frontend", "Backend", "Database"],
        },
      ];
      setupQueries(mockFields, []);
      mockSetValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.click(screen.getByLabelText("Frontend"));
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith({
          issueId: mockIssueId,
          fieldId: "field1",
          value: "Frontend",
        });
      });
    });

    it("should handle multiple selections with comma separation", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Tags",
          fieldType: "multiselect" as const,
          isRequired: false,
          options: ["Frontend", "Backend", "Database"],
        },
      ];
      setupQueries(mockFields, []);
      mockSetValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.click(screen.getByLabelText("Frontend"));
      await user.click(screen.getByLabelText("Backend"));
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith({
          issueId: mockIssueId,
          fieldId: "field1",
          value: "Frontend, Backend",
        });
      });
    });

    it("should remove option from comma-separated value when unchecked", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Tags",
          fieldType: "multiselect" as const,
          isRequired: false,
          options: ["Frontend", "Backend", "Database"],
        },
      ];
      setupQueries(mockFields, []);
      mockSetValue.mockResolvedValue({});

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.click(screen.getByLabelText("Frontend"));
      await user.click(screen.getByLabelText("Backend"));
      // Uncheck Frontend
      await user.click(screen.getByLabelText("Frontend"));
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith({
          issueId: mockIssueId,
          fieldId: "field1",
          value: "Backend",
        });
      });
    });

    it("should parse existing comma-separated values and check correct boxes", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Tags",
          fieldType: "multiselect" as const,
          isRequired: false,
          options: ["Frontend", "Backend", "Database"],
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "Frontend, Database",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      const frontendCheckbox = screen.getByLabelText("Frontend") as HTMLInputElement;
      const backendCheckbox = screen.getByLabelText("Backend") as HTMLInputElement;
      const databaseCheckbox = screen.getByLabelText("Database") as HTMLInputElement;

      expect(frontendCheckbox.checked).toBe(true);
      expect(backendCheckbox.checked).toBe(false);
      expect(databaseCheckbox.checked).toBe(true);
    });
  });

  describe("Value Display Formatting", () => {
    it("should display 'Not set' when value is empty", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      expect(screen.getByText("Not set")).toBeInTheDocument();
    });

    it("should display 'Yes' with check icon for checkbox value 'true'", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Is Verified",
          fieldType: "checkbox" as const,
          isRequired: false,
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "true",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      // Icon is rendered as SVG with text "Yes"
      expect(screen.getByText(/Yes/)).toBeInTheDocument();
    });

    it("should display 'No' with X icon for checkbox value 'false'", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Is Verified",
          fieldType: "checkbox" as const,
          isRequired: false,
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "false",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      // Icon is rendered as SVG with text "No"
      expect(screen.getByText(/No/)).toBeInTheDocument();
    });

    it("should display URL as clickable link with target blank", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Documentation",
          fieldType: "url" as const,
          isRequired: false,
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "https://example.com",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      const link = screen.getByRole("link") as HTMLAnchorElement;
      expect(link.href).toBe("https://example.com/");
      expect(link.target).toBe("_blank");
      expect(link.rel).toBe("noopener noreferrer");
    });

    it("should format date values for display", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Due Date",
          fieldType: "date" as const,
          isRequired: false,
        },
      ];
      const testDate = "2026-01-15";
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: testDate,
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      const formattedDate = new Date(testDate).toLocaleDateString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it("should display multiselect values as chips", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Tags",
          fieldType: "multiselect" as const,
          isRequired: false,
          options: ["Frontend", "Backend"],
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "Frontend, Backend",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      // Both values should be displayed
      expect(screen.getByText("Frontend")).toBeInTheDocument();
      expect(screen.getByText("Backend")).toBeInTheDocument();
    });

    it("should trim whitespace in multiselect chip display", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Tags",
          fieldType: "multiselect" as const,
          isRequired: false,
          options: ["Frontend", "Backend"],
        },
      ];
      const mockValues = [
        {
          fieldId: "field1" as Id<"customFields">,
          value: "  Frontend  ,  Backend  ",
        },
      ];
      setupQueries(mockFields, mockValues);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      // Should display trimmed values
      expect(screen.getByText("Frontend")).toBeInTheDocument();
      expect(screen.getByText("Backend")).toBeInTheDocument();
    });
  });

  describe("Required Field Indicator", () => {
    it("should show asterisk for required fields", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Required Field",
          fieldType: "text" as const,
          isRequired: true,
        },
      ];
      setupQueries(mockFields, []);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should not show asterisk for optional fields", () => {
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Optional Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should show error toast when save fails", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);
      mockSetValue.mockRejectedValue(new Error("Network error"));

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.type(screen.getByRole("textbox"), "Test value");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Network error");
      });
    });

    it("should show generic error when error has no message", async () => {
      const user = userEvent.setup();
      const mockFields = [
        {
          _id: "field1" as Id<"customFields">,
          name: "Test Field",
          fieldType: "text" as const,
          isRequired: false,
        },
      ];
      setupQueries(mockFields, []);
      // Reject with a non-Error to trigger the fallback message
      mockSetValue.mockRejectedValue("Unknown error");

      render(<CustomFieldValues issueId={mockIssueId} projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Set/i }));
      await user.type(screen.getByRole("textbox"), "Test value");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update field");
      });
    });
  });
});
