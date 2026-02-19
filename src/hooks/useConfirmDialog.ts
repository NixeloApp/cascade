/**
 * Hook for managing confirmation dialogs
 * Pairs with ConfirmDialog component for consistent confirmation UX
 */

import { useState } from "react";

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "info";
}

export interface UseConfirmDialogReturn {
  /** Current dialog state */
  dialogState: ConfirmDialogState;
  /** Whether confirmation action is in progress */
  isConfirming: boolean;
  /** Open confirmation dialog */
  openConfirm: (config: Omit<ConfirmDialogState, "isOpen">) => void;
  /** Close the dialog without confirming */
  closeConfirm: () => void;
  /** Execute the confirmation action */
  handleConfirm: (action: () => Promise<void> | void) => Promise<void>;
}

const initialState: ConfirmDialogState = {
  isOpen: false,
  title: "",
  message: "",
  confirmLabel: "Confirm",
  variant: "warning",
};

/**
 * Manage confirmation dialog state and execution
 *
 * @example
 * const { dialogState, isConfirming, openConfirm, closeConfirm, handleConfirm } =
 *   useConfirmDialog();
 *
 * const handleDelete = () => {
 *   openConfirm({
 *     title: "Delete Item",
 *     message: "Are you sure you want to delete this item?",
 *     confirmLabel: "Delete",
 *     variant: "danger",
 *   });
 * };
 *
 * // In JSX:
 * <Button onClick={handleDelete}>Delete</Button>
 *
 * <ConfirmDialog
 *   isOpen={dialogState.isOpen}
 *   onClose={closeConfirm}
 *   onConfirm={() => handleConfirm(async () => {
 *     await deleteMutation({ id: itemId });
 *   })}
 *   title={dialogState.title}
 *   message={dialogState.message}
 *   confirmLabel={dialogState.confirmLabel}
 *   variant={dialogState.variant}
 *   isLoading={isConfirming}
 * />
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>(initialState);
  const [isConfirming, setIsConfirming] = useState(false);

  const openConfirm = (config: Omit<ConfirmDialogState, "isOpen">) => {
    setDialogState({
      isOpen: true,
      ...config,
    });
  };

  const closeConfirm = () => {
    setDialogState(initialState);
  };

  const handleConfirm = async (action: () => Promise<void> | void) => {
    setIsConfirming(true);
    try {
      await action();
      setDialogState(initialState);
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    dialogState,
    isConfirming,
    openConfirm,
    closeConfirm,
    handleConfirm,
  };
}
