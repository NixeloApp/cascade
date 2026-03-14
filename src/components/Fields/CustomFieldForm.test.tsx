import type { Id } from "@convex/_generated/dataModel";
import userEvent from "@testing-library/user-event";
import type { ReactMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import type { ReactNode } from "react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthenticatedMutation } from "@/hooks/useConvexHelpers";
import { showError, showSuccess } from "@/lib/toast";
import { render, screen, waitFor } from "@/test/custom-render";
import { CustomFieldForm } from "./CustomFieldForm";

vi.mock("@/hooks/useConvexHelpers", () => ({
  useAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("../ui/FormDialog", () => ({
  FormDialog: ({
    open,
    onOpenChange,
    onSave,
    title,
    children,
    isLoading,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: () => void | Promise<void>;
    title: string;
    children: ReactNode;
    isLoading?: boolean;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <div>{title}</div>
        {children}
        <button type="button" onClick={() => onOpenChange(false)}>
          Cancel
        </button>
        <button type="button" onClick={() => void onSave()} disabled={isLoading}>
          Save
        </button>
      </div>
    ) : null,
}));

const mockUseAuthenticatedMutation = vi.mocked(useAuthenticatedMutation);

const createField = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const updateField = vi.fn() as Mock & ReactMutation<FunctionReference<"mutation">>;
const onOpenChange = vi.fn();
const projectId = "project_1" as Id<"projects">;

describe("CustomFieldForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let mutationIndex = 0;
    mockUseAuthenticatedMutation.mockImplementation(() =>
      mutationIndex++ % 2 === 0
        ? { mutate: createField, canAct: true, isAuthLoading: false }
        : { mutate: updateField, canAct: true, isAuthLoading: false },
    );
  });

  it("creates a new select field with normalized key and parsed options", async () => {
    const user = userEvent.setup();
    createField.mockResolvedValue(undefined);

    render(<CustomFieldForm projectId={projectId} open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Field Name *"), "Customer Segment");
    await user.type(screen.getByLabelText("Field Key *"), "Customer Segment Value");
    await user.selectOptions(screen.getByLabelText("Field Type *"), "select");
    await user.type(screen.getByLabelText("Options *"), "Enterprise, SMB,  Mid-Market  ");
    await user.type(screen.getByLabelText("Description"), "Segments used for planning");
    await user.click(screen.getByLabelText("Required field"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(createField).toHaveBeenCalledWith({
        projectId,
        name: "Customer Segment",
        fieldKey: "customer_segment_value",
        fieldType: "select",
        options: ["Enterprise", "SMB", "Mid-Market"],
        isRequired: true,
        description: "Segments used for planning",
      }),
    );
    expect(showSuccess).toHaveBeenCalledWith("Field created");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("prefills edit mode, hides the field key, and updates the editable attributes only", async () => {
    const user = userEvent.setup();
    updateField.mockResolvedValue(undefined);

    render(
      <CustomFieldForm
        projectId={projectId}
        open
        onOpenChange={onOpenChange}
        field={{
          _id: "field_1" as Id<"customFields">,
          name: "Story points",
          fieldKey: "story_points",
          fieldType: "multiselect",
          options: ["1", "2", "3"],
          isRequired: false,
          description: "Sizing buckets",
        }}
      />,
    );

    expect(screen.queryByLabelText("Field Key *")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Field Type *")).toBeDisabled();
    expect(screen.getByLabelText("Field Name *")).toHaveValue("Story points");
    expect(screen.getByLabelText("Options *")).toHaveValue("1, 2, 3");

    await user.clear(screen.getByLabelText("Field Name *"));
    await user.type(screen.getByLabelText("Field Name *"), "Effort");
    await user.clear(screen.getByLabelText("Options *"));
    await user.type(screen.getByLabelText("Options *"), "Small, Medium");
    await user.clear(screen.getByLabelText("Description"));
    await user.click(screen.getByLabelText("Required field"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateField).toHaveBeenCalledWith({
        id: "field_1",
        name: "Effort",
        options: ["Small", "Medium"],
        isRequired: true,
        description: undefined,
      }),
    );
    expect(showSuccess).toHaveBeenCalledWith("Field updated");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows a validation error when required create fields are missing", async () => {
    const user = userEvent.setup();

    render(<CustomFieldForm projectId={projectId} open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Field Name *"), "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(showError).toHaveBeenCalledWith("Please fill in all required fields");
    expect(createField).not.toHaveBeenCalled();
    expect(updateField).not.toHaveBeenCalled();
  });
});
