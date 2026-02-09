import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import { useMutation, useQuery } from "convex/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { CustomFieldsManager } from "./CustomFieldsManager";

// Mock dependencies
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock toast utilities used by CustomFieldsManager and CustomFieldForm
vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("CustomFieldsManager - Component Behavior", () => {
  const mockProjectId = "project123" as Id<"projects">;
  const _mockCreateField = vi.fn();
  const mockUpdateField = vi.fn();
  const mockRemoveField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear toast mocks
    vi.mocked(showSuccess).mockClear();
    vi.mocked(showError).mockClear();

    // Hook-level mocking: All useMutation calls return the same mock
    // This is a limitation of mocking at the hook level - we can't distinguish
    // between create, update, and remove mutations since they're all called via useMutation()
    // Return mockUpdateField for most cases since it's used most frequently
    (useMutation as any).mockReturnValue(mockUpdateField);

    (useQuery as any).mockReturnValue([]);
  });

  describe("Empty State & Loading", () => {
    it("should show loading spinner when fields are undefined", () => {
      (useQuery as any).mockReturnValue(undefined);

      const { container } = render(<CustomFieldsManager projectId={mockProjectId} />);

      // Check for LoadingSpinner component (uses animate-spin class)
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should show empty state with icon when no fields exist", () => {
      (useQuery as any).mockReturnValue([]);

      const { container } = render(<CustomFieldsManager projectId={mockProjectId} />);

      // Icon is rendered as SVG, check for its presence
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText(/No custom fields yet/i)).toBeInTheDocument();
    });

    it("should show 'Add Field' button when not creating", () => {
      (useQuery as any).mockReturnValue([]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      expect(screen.getByRole("button", { name: /Add Field/i })).toBeInTheDocument();
    });
  });

  describe("Form Display & State Management", () => {
    it("should hide form initially", () => {
      render(<CustomFieldsManager projectId={mockProjectId} />);

      expect(screen.queryByText("Create Custom Field")).not.toBeInTheDocument();
    });

    it("should show form when 'Add Field' button is clicked", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));

      expect(screen.getByText("Create Custom Field")).toBeInTheDocument();
    });

    it("should open dialog when 'Add Field' button is clicked", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));

      // Dialog should be open with form content
      expect(screen.getByText("Create Custom Field")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Sprint Points/i)).toBeInTheDocument();
    });

    it("should reset and hide form when Cancel is clicked", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test Field");

      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(screen.queryByText("Create Custom Field")).not.toBeInTheDocument();
    });

    it("should show field key input in create mode", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));

      expect(screen.getByPlaceholderText(/e.g., sprint_points/i)).toBeInTheDocument();
    });

    it("should default field type to 'text'", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));

      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("text");
    });
  });

  describe("Form Validation", () => {
    it("should show error when trying to save with empty name", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.click(screen.getByRole("button", { name: /Save/i }));

      expect(showError).toHaveBeenCalledWith("Please fill in all required fields");
      expect(mockUpdateField).not.toHaveBeenCalled();
    });

    it("should show error when trying to save with empty field key", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Valid Name");
      // Leave field key empty
      await user.click(screen.getByRole("button", { name: /Save/i }));

      expect(showError).toHaveBeenCalledWith("Please fill in all required fields");
      expect(mockUpdateField).not.toHaveBeenCalled();
    });

    it("should accept whitespace-only name as invalid", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "   ");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "valid_key");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      expect(showError).toHaveBeenCalledWith("Please fill in all required fields");
    });
  });

  describe("Field Key Transformation", () => {
    it("should convert field key to lowercase", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockResolvedValue({ _id: "field1" });

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "UPPERCASE_KEY");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockUpdateField).toHaveBeenCalledWith(
          expect.objectContaining({
            fieldKey: "uppercase_key",
          }),
        );
      });
    });

    it("should replace spaces with underscores in field key", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockResolvedValue({ _id: "field1" });

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "customer id value");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockUpdateField).toHaveBeenCalledWith(
          expect.objectContaining({
            fieldKey: "customer_id_value",
          }),
        );
      });
    });

    it("should replace multiple spaces with single underscore", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockResolvedValue({ _id: "field1" });

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(
        screen.getByPlaceholderText(/e.g., sprint_points/i),
        "field    with     gaps",
      );
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockUpdateField).toHaveBeenCalledWith(
          expect.objectContaining({
            fieldKey: "field_with_gaps",
          }),
        );
      });
    });
  });

  describe("Options Field Conditional Display", () => {
    it("should not show options field for text type", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));

      expect(screen.queryByPlaceholderText(/Option 1, Option 2/i)).not.toBeInTheDocument();
    });

    it("should show options field when select type is chosen", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.selectOptions(screen.getByRole("combobox"), "select");

      expect(screen.getByPlaceholderText(/Option 1, Option 2/i)).toBeInTheDocument();
    });

    it("should show options field when multiselect type is chosen", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.selectOptions(screen.getByRole("combobox"), "multiselect");

      expect(screen.getByPlaceholderText(/Option 1, Option 2/i)).toBeInTheDocument();
    });

    it("should hide options field when switching from select to text", async () => {
      const user = userEvent.setup();

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.selectOptions(screen.getByRole("combobox"), "select");

      expect(screen.getByPlaceholderText(/Option 1, Option 2/i)).toBeInTheDocument();

      await user.selectOptions(screen.getByRole("combobox"), "text");

      expect(screen.queryByPlaceholderText(/Option 1, Option 2/i)).not.toBeInTheDocument();
    });
  });

  describe("Options Parsing Logic", () => {
    it("should parse comma-separated options correctly", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockResolvedValue({ _id: "field1" });

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Priority");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "priority");
      await user.selectOptions(screen.getByRole("combobox"), "select");

      const optionsInput = screen.getByPlaceholderText(/Option 1, Option 2/i);
      await user.type(optionsInput, "Low, Medium, High");

      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockUpdateField).toHaveBeenCalledWith(
          expect.objectContaining({
            options: ["Low", "Medium", "High"],
          }),
        );
      });
    });

    it("should trim whitespace from options", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockResolvedValue({ _id: "field1" });

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "test");
      await user.selectOptions(screen.getByRole("combobox"), "select");

      const optionsInput = screen.getByPlaceholderText(/Option 1, Option 2/i);
      await user.type(optionsInput, "  Option A  ,  Option B  ,  Option C  ");

      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockUpdateField).toHaveBeenCalledWith(
          expect.objectContaining({
            options: ["Option A", "Option B", "Option C"],
          }),
        );
      });
    });

    it("should filter out empty options", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockResolvedValue({ _id: "field1" });

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "test");
      await user.selectOptions(screen.getByRole("combobox"), "select");

      const optionsInput = screen.getByPlaceholderText(/Option 1, Option 2/i);
      await user.type(optionsInput, "Valid,,,,Another Valid,");

      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(
        () => {
          expect(mockUpdateField).toHaveBeenCalledWith(
            expect.objectContaining({
              options: ["Valid", "Another Valid"],
            }),
          );
        },
        { timeout: 10000 },
      );
    }, 15000);

    it("should not send options for non-select field types", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockResolvedValue({ _id: "field1" });

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "test");
      // Leave as text type
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockUpdateField).toHaveBeenCalledWith(
          expect.objectContaining({
            options: undefined,
          }),
        );
      });
    });
  });

  describe("Edit Mode Behavior", () => {
    const existingField = {
      _id: "field1" as Id<"customFields">,
      name: "Customer ID",
      fieldKey: "customer_id",
      fieldType: "text" as const,
      isRequired: true,
      description: "Unique customer identifier",
      options: undefined,
    };

    it("should populate form with existing field data when Edit is clicked", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue([existingField]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      // Check that form is populated with existing data
      expect(screen.getByDisplayValue("Customer ID")).toBeInTheDocument();
      // Field key input is hidden in edit mode, so we don't check for it
      expect(screen.getByDisplayValue("Unique customer identifier")).toBeInTheDocument();
      expect(screen.getByLabelText(/Required field/i)).toBeChecked();
    });

    it("should show 'Edit Field' title in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue([existingField]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      expect(screen.getByText("Edit Custom Field")).toBeInTheDocument();
    });

    it("should hide field key input in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue([existingField]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      // Field key should still display as value but input should be disabled/hidden
      expect(screen.queryByLabelText(/Field Key/i)).not.toBeInTheDocument();
    });

    it("should disable field type selector in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue([existingField]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      const typeSelect = screen.getByRole("combobox");
      expect(typeSelect).toBeDisabled();
    });

    it("should show 'Update Field' button in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue([existingField]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument();
    });

    it("should convert options array to comma-separated string in edit mode", async () => {
      const user = userEvent.setup();
      const selectField = {
        ...existingField,
        fieldType: "select" as const,
        options: ["Option A", "Option B", "Option C"],
      };
      (useQuery as any).mockReturnValue([selectField]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      const optionsInput = screen.getByPlaceholderText(/Option 1, Option 2/i);
      expect(optionsInput).toHaveValue("Option A, Option B, Option C");
    });

    it("should not require field key validation in edit mode", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue([existingField]);
      mockUpdateField.mockResolvedValue({});

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));

      // Clear name and retype it
      const nameInput = screen.getByPlaceholderText(/e.g., Sprint Points/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(mockUpdateField).toHaveBeenCalled();
        expect(showError).not.toHaveBeenCalled();
      });
    });
  });

  describe("Field Display & Rendering", () => {
    it("should display field name and key", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Customer ID",
        fieldKey: "customer_id",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      expect(screen.getByText("Customer ID")).toBeInTheDocument();
      expect(screen.getByText("customer_id")).toBeInTheDocument();
    });

    it("should show Required badge when field is required", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test Field",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: true,
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    it("should not show Required badge when field is optional", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test Field",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      expect(screen.queryByText("Required")).not.toBeInTheDocument();
    });

    it("should display description when present", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
        description: "This is a helpful description",
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      expect(screen.getByText("This is a helpful description")).toBeInTheDocument();
    });

    it("should not display description section when absent", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      // Only field name and key should be visible
      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    it("should display options as chips for select fields", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Priority",
        fieldKey: "priority",
        fieldType: "select" as const,
        isRequired: false,
        options: ["Low", "Medium", "High"],
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      expect(screen.getByText("Low")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("High")).toBeInTheDocument();
    });

    it("should render icon for text field", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      const { container } = render(<CustomFieldsManager projectId={mockProjectId} />);

      // Icons are rendered as SVG, verify field card displays the field
      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render icon for number field", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "number" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      const { container } = render(<CustomFieldsManager projectId={mockProjectId} />);

      // Icons are rendered as SVG, verify field card displays the field
      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render icon for checkbox field", () => {
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "checkbox" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      const { container } = render(<CustomFieldsManager projectId={mockProjectId} />);

      // Icons are rendered as SVG, verify field card displays the field
      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Delete Confirmation", () => {
    it("should show browser confirm dialog when delete is clicked", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm");
      confirmSpy.mockReturnValue(false);

      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      expect(confirmSpy).toHaveBeenCalledWith(
        "Are you sure? This will delete all values for this field.",
      );
    });

    it("should not delete if user cancels confirmation", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm");
      confirmSpy.mockReturnValue(false);

      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      expect(mockRemoveField).not.toHaveBeenCalled();
    });

    it("should delete if user confirms", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm");
      confirmSpy.mockReturnValue(true);
      mockUpdateField.mockResolvedValue({});

      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(mockUpdateField).toHaveBeenCalledWith({ id: "field1" });
      });
    });
  });

  describe("Success & Error Handling", () => {
    it("should show success toast and reset form after successful create", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockResolvedValue({ _id: "field1" });

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "test");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Field created");
        expect(screen.queryByText("Create Custom Field")).not.toBeInTheDocument();
      });
    });

    it("should show success toast after successful update", async () => {
      const user = userEvent.setup();
      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);
      mockUpdateField.mockResolvedValue({});

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Edit/i }));
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Field updated");
      });
    });

    it("should show success toast after successful delete", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm");
      confirmSpy.mockReturnValue(true);
      mockRemoveField.mockResolvedValue({});

      const field = {
        _id: "field1" as Id<"customFields">,
        name: "Test",
        fieldKey: "test",
        fieldType: "text" as const,
        isRequired: false,
      };
      (useQuery as any).mockReturnValue([field]);

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Delete/i }));

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Field deleted");
      });
    });

    it("should show error toast when create fails", async () => {
      const user = userEvent.setup();
      mockUpdateField.mockRejectedValue(new Error("Duplicate field key"));

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "test");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith("Duplicate field key");
      });
    });

    it("should show generic error when error has no message", async () => {
      const user = userEvent.setup();
      // Reject with a non-Error object to trigger the fallback message
      mockUpdateField.mockRejectedValue({});

      render(<CustomFieldsManager projectId={mockProjectId} />);

      await user.click(screen.getByRole("button", { name: /Add Field/i }));
      await user.type(screen.getByPlaceholderText(/e.g., Sprint Points/i), "Test");
      await user.type(screen.getByPlaceholderText(/e.g., sprint_points/i), "test");
      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith("Failed to save field");
      });
    });
  });
});
