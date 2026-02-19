/**
 * Hook for managing delete confirmation dialogs
 * Pairs with ConfirmDialog component for consistent delete UX
 */

import type { Id, TableNames } from "@convex/_generated/dataModel";
import { useState } from "react";
import { showError, showSuccess } from "../lib/toast";

export interface UseDeleteConfirmationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface UseDeleteConfirmationReturn<T extends TableNames> {
  /** ID pending deletion (null if no confirmation dialog open) */
  deleteId: Id<T> | null;
  /** Whether delete is in progress */
  isDeleting: boolean;
  /** Open confirmation dialog for an item */
  confirmDelete: (id: Id<T>) => void;
  /** Cancel the delete (close dialog) */
  cancelDelete: () => void;
  /** Execute the delete after confirmation - receives the ID as parameter */
  executeDelete: (deleteFn: (id: Id<T>) => Promise<void>) => Promise<void>;
}

/**
 * Manage delete confirmation state and execution
 *
 * @example
 * const deleteMutation = useMutation(api.labels.remove);
 * const { deleteId, isDeleting, confirmDelete, cancelDelete, executeDelete } =
 *   useDeleteConfirmation<"labels">({
 *     successMessage: "Label deleted",
 *   });
 *
 * // In JSX:
 * <Button onClick={() => confirmDelete(item._id)}>Delete</Button>
 *
 * <ConfirmDialog
 *   isOpen={!!deleteId}
 *   onClose={cancelDelete}
 *   onConfirm={() => executeDelete((id) => deleteMutation({ id }))}
 *   title="Delete Label"
 *   message="Are you sure?"
 *   variant="danger"
 *   isLoading={isDeleting}
 * />
 */
export function useDeleteConfirmation<T extends TableNames>(
  options: UseDeleteConfirmationOptions = {},
): UseDeleteConfirmationReturn<T> {
  const {
    onSuccess,
    onError,
    successMessage = "Deleted successfully",
    errorMessage = "Failed to delete",
  } = options;

  const [deleteId, setDeleteId] = useState<Id<T> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = (id: Id<T>) => {
    setDeleteId(id);
  };

  const cancelDelete = () => {
    setDeleteId(null);
  };

  const executeDelete = async (deleteFn: (id: Id<T>) => Promise<void>) => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteFn(deleteId);
      showSuccess(successMessage);
      onSuccess?.();
      setDeleteId(null);
    } catch (error) {
      showError(error, errorMessage);
      onError?.(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteId,
    isDeleting,
    confirmDelete,
    cancelDelete,
    executeDelete,
  };
}
