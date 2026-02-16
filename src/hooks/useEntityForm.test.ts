import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEntityForm } from "./useEntityForm";

interface TestEntity {
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
}

const defaultValues: TestEntity = {
  name: "",
  description: "",
  priority: 1,
  isActive: false,
};

describe("useEntityForm", () => {
  describe("initial state", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      expect(result.current.formData).toEqual(defaultValues);
    });

    it("should not be editing initially", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      expect(result.current.isEditing).toBe(false);
    });

    it("should have no editingId initially", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      expect(result.current.editingId).toBeNull();
    });
  });

  describe("updateField", () => {
    it("should update a string field", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.updateField("name", "Test Name");
      });

      expect(result.current.formData.name).toBe("Test Name");
    });

    it("should update a number field", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.updateField("priority", 5);
      });

      expect(result.current.formData.priority).toBe(5);
    });

    it("should update a boolean field", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.updateField("isActive", true);
      });

      expect(result.current.formData.isActive).toBe(true);
    });

    it("should preserve other fields when updating", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.updateField("name", "Test Name");
        result.current.updateField("priority", 3);
      });

      expect(result.current.formData).toEqual({
        ...defaultValues,
        name: "Test Name",
        priority: 3,
      });
    });
  });

  describe("setFormData", () => {
    it("should replace entire form data", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      const newData: TestEntity = {
        name: "New Name",
        description: "New Description",
        priority: 10,
        isActive: true,
      };

      act(() => {
        result.current.setFormData(newData);
      });

      expect(result.current.formData).toEqual(newData);
    });
  });

  describe("startCreate", () => {
    it("should set isEditing to true", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.startCreate();
      });

      expect(result.current.isEditing).toBe(true);
    });

    it("should reset form data to defaults", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      // First modify the form
      act(() => {
        result.current.updateField("name", "Modified Name");
      });

      // Then start create
      act(() => {
        result.current.startCreate();
      });

      expect(result.current.formData).toEqual(defaultValues);
    });

    it("should clear editingId", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      // First load for edit
      act(() => {
        result.current.loadForEdit({
          _id: "123",
          name: "Test",
          description: "Test",
          priority: 1,
          isActive: true,
        });
      });

      // Then start create
      act(() => {
        result.current.startCreate();
      });

      expect(result.current.editingId).toBeNull();
    });
  });

  describe("loadForEdit", () => {
    it("should set isEditing to true", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.loadForEdit({
          _id: "123",
          name: "Test Name",
          description: "Test Desc",
          priority: 5,
          isActive: true,
        });
      });

      expect(result.current.isEditing).toBe(true);
    });

    it("should set editingId from item", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.loadForEdit({
          _id: "entity-456",
          name: "Test",
          description: "",
          priority: 1,
          isActive: false,
        });
      });

      expect(result.current.editingId).toBe("entity-456");
    });

    it("should populate formData from item (excluding _id)", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.loadForEdit({
          _id: "123",
          name: "Loaded Name",
          description: "Loaded Description",
          priority: 7,
          isActive: true,
        });
      });

      expect(result.current.formData).toEqual({
        name: "Loaded Name",
        description: "Loaded Description",
        priority: 7,
        isActive: true,
      });
    });

    it("should not include _id in formData", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.loadForEdit({
          _id: "123",
          name: "Test",
          description: "",
          priority: 1,
          isActive: false,
        });
      });

      expect("_id" in result.current.formData).toBe(false);
    });
  });

  describe("resetForm", () => {
    it("should reset formData to defaults", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      // Modify form
      act(() => {
        result.current.updateField("name", "Modified");
        result.current.updateField("priority", 99);
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData).toEqual(defaultValues);
    });

    it("should set isEditing to false", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.startCreate();
      });
      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.resetForm();
      });
      expect(result.current.isEditing).toBe(false);
    });

    it("should clear editingId", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      act(() => {
        result.current.loadForEdit({
          _id: "123",
          name: "Test",
          description: "",
          priority: 1,
          isActive: false,
        });
      });
      expect(result.current.editingId).toBe("123");

      act(() => {
        result.current.resetForm();
      });
      expect(result.current.editingId).toBeNull();
    });
  });

  describe("workflow scenarios", () => {
    it("should handle create -> reset -> edit workflow", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      // Start create
      act(() => {
        result.current.startCreate();
      });
      expect(result.current.isEditing).toBe(true);
      expect(result.current.editingId).toBeNull();

      // Fill form
      act(() => {
        result.current.updateField("name", "New Item");
      });

      // Reset (cancel)
      act(() => {
        result.current.resetForm();
      });
      expect(result.current.isEditing).toBe(false);
      expect(result.current.formData.name).toBe("");

      // Load for edit
      act(() => {
        result.current.loadForEdit({
          _id: "existing-123",
          name: "Existing Item",
          description: "Description",
          priority: 3,
          isActive: true,
        });
      });
      expect(result.current.isEditing).toBe(true);
      expect(result.current.editingId).toBe("existing-123");
      expect(result.current.formData.name).toBe("Existing Item");
    });

    it("should handle edit -> modify -> reset workflow", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      // Load for edit
      act(() => {
        result.current.loadForEdit({
          _id: "item-1",
          name: "Original",
          description: "",
          priority: 1,
          isActive: false,
        });
      });

      // Modify
      act(() => {
        result.current.updateField("name", "Modified");
        result.current.updateField("isActive", true);
      });
      expect(result.current.formData.name).toBe("Modified");

      // Reset (cancel edit)
      act(() => {
        result.current.resetForm();
      });
      expect(result.current.formData).toEqual(defaultValues);
      expect(result.current.editingId).toBeNull();
    });

    it("should handle switching between edit items", () => {
      const { result } = renderHook(() => useEntityForm(defaultValues));

      // Edit first item
      act(() => {
        result.current.loadForEdit({
          _id: "item-1",
          name: "Item 1",
          description: "Desc 1",
          priority: 1,
          isActive: false,
        });
      });
      expect(result.current.editingId).toBe("item-1");

      // Switch to second item
      act(() => {
        result.current.loadForEdit({
          _id: "item-2",
          name: "Item 2",
          description: "Desc 2",
          priority: 2,
          isActive: true,
        });
      });
      expect(result.current.editingId).toBe("item-2");
      expect(result.current.formData.name).toBe("Item 2");
    });
  });
});
