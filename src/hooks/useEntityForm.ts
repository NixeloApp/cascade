import { useState } from "react";

/**
 * Reusable hook for managing entity forms (create/edit pattern)
 * Eliminates boilerplate code across all "Manager" components
 */
export function useEntityForm<T extends Record<string, unknown>>(defaultValues: T) {
  const [formData, setFormData] = useState<T>(defaultValues);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultValues);
    setIsEditing(false);
    setEditingId(null);
  };

  const loadForEdit = (item: T & { _id: string }) => {
    const data = { ...item };
    delete (data as T & { _id?: string })._id;
    setFormData(data as T);
    setEditingId(item._id);
    setIsEditing(true);
  };

  const startCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  return {
    formData,
    setFormData,
    updateField,
    isEditing,
    editingId,
    resetForm,
    loadForEdit,
    startCreate,
  };
}
