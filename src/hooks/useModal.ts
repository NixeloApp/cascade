/**
 * Hook for managing modal open/close state
 */

import { useState } from "react";

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Manage modal open/close state with convenient handlers
 */
export function useModal(initialState = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => {
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
