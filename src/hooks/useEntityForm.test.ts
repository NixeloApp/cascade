import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@/test/custom-render";
import { useEntityForm } from "./useEntityForm";

const DEFAULT_NAME = "Backlog";
const DEFAULT_DESCRIPTION = "Default workflow";
const UPDATED_NAME = "In Progress";
const UPDATED_DESCRIPTION = "Ready for active work";
const ITEM_ID = "entity_1";

type FormValues = Record<"name" | "description", string>;

const defaultValues: FormValues = {
  name: DEFAULT_NAME,
  description: DEFAULT_DESCRIPTION,
};

describe("useEntityForm", () => {
  beforeEach(() => {
    // No mock state to clear for this hook-only test suite.
  });

  it("updates individual fields while preserving the rest of the form state", () => {
    const { result } = renderHook(() => useEntityForm(defaultValues));

    act(() => {
      result.current.updateField("name", UPDATED_NAME);
    });

    expect(result.current.formData).toEqual({
      name: UPDATED_NAME,
      description: DEFAULT_DESCRIPTION,
    });
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editingId).toBeNull();
  });

  it("loads an existing item for editing and strips the entity id from form data", () => {
    const { result } = renderHook(() => useEntityForm(defaultValues));

    act(() => {
      result.current.loadForEdit({
        _id: ITEM_ID,
        name: UPDATED_NAME,
        description: UPDATED_DESCRIPTION,
      });
    });

    expect(result.current.formData).toEqual({
      name: UPDATED_NAME,
      description: UPDATED_DESCRIPTION,
    });
    expect(result.current.isEditing).toBe(true);
    expect(result.current.editingId).toBe(ITEM_ID);
  });

  it("resets the form and create flow back to defaults while reopening edit mode", () => {
    const { result } = renderHook(() => useEntityForm(defaultValues));

    act(() => {
      result.current.loadForEdit({
        _id: ITEM_ID,
        name: UPDATED_NAME,
        description: UPDATED_DESCRIPTION,
      });
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual(defaultValues);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editingId).toBeNull();

    act(() => {
      result.current.startCreate();
    });

    expect(result.current.formData).toEqual(defaultValues);
    expect(result.current.isEditing).toBe(true);
    expect(result.current.editingId).toBeNull();
  });
});
