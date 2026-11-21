import { Plus } from "lucide-react";
import { forwardRef } from "react";

import { Button } from "@/components/ui/button";

/**
 * The dashed "+ something" pill that stands in for an optional part of the form until the
 * user adds it (a discount, a custom column, a QR code...).
 */
export const AddPillButton = forwardRef<HTMLButtonElement, AddPillButtonProps>(
  function AddPillButton({ children, onClick, testId }, ref) {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        // last in a row it shares with open cards: what's added goes above what's left
        className="order-last h-[34px] rounded-full border-dashed border-slate-300 px-3 text-[13px] font-normal text-slate-600 shadow-none hover:border-slate-400 hover:bg-white hover:text-slate-950 max-md:h-10"
        onClick={onClick}
        data-testid={testId}
      >
        <Plus className="size-3.5" strokeWidth={2.25} />
        {children}
      </Button>
    );
  },
);

let lastOpenOrder = 0;

/**
 * The CSS `order` for a card opened from a pill: one past the last card opened, so in a
 * row of pills and cards a newly added card lands after the ones already open, right
 * where its pill was, and every pill (`order-last`) stays after the cards. Cards that
 * start open keep `order: 0`, their place in the markup.
 */
export function takeOpenOrder() {
  // under order-last (9999), which keeps every pill after every card
  lastOpenOrder = Math.min(lastOpenOrder + 1, 9998);

  return lastOpenOrder;
}

interface AddPillButtonProps {
  /** What the pill adds, e.g. "Add discount" or "QR code". */
  children: React.ReactNode;
  onClick: () => void;
  testId?: string;
}
