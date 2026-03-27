import { useState } from "react";

/**
 * Hook to manage confirmation dialog when discarding unsaved changes
 */
export function useConfirmDiscard() {
  const [isConfirmDiscardDialogOpen, setIsConfirmDiscardDialogOpen] =
    useState(false);

  return {
    isConfirmDiscardDialogOpen,
    setIsConfirmDiscardDialogOpen,
  };
}
