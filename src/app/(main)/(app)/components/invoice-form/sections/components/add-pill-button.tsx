import { Plus } from "lucide-react";
import { forwardRef } from "react";

import { Button } from "@/components/ui/button";

/**
 * The dashed "+ something" pill that stands in for an optional part of the form until the
 * user adds it (a discount, a GTU code, a QR code...).
 */
export const AddPillButton = forwardRef<HTMLButtonElement, AddPillButtonProps>(
  function AddPillButton({ children, onClick, testId }, ref) {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        className="h-[34px] rounded-full border-dashed border-slate-300 px-3 text-[13px] font-normal text-slate-600 shadow-none hover:border-slate-400 hover:bg-white hover:text-slate-950 max-md:h-10"
        onClick={onClick}
        data-testid={testId}
      >
        <Plus className="size-3.5" strokeWidth={2.25} />
        {children}
      </Button>
    );
  },
);

interface AddPillButtonProps {
  /** What the pill adds, e.g. "Add discount" or "QR code". */
  children: React.ReactNode;
  onClick: () => void;
  testId?: string;
}
