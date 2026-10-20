import { Trash2 } from "lucide-react";

import { CustomTooltip } from "@/components/ui/tooltip";

/**
 * The round red trash button that sits on the corner of a form section, used to delete an
 * invoice item and to remove an item's discount.
 */
export function DeleteIconButton({
  label,
  tooltip = label,
  onClick,
}: DeleteIconButtonProps) {
  return (
    <CustomTooltip
      trigger={
        <button
          type="button"
          // Safari does not focus a button on mousedown, so focus leaves the
          // field the user was editing and lands on the nearest focusable
          // ancestor -- on mobile that is Radix's tab panel, which Safari then
          // scrolls into view (smoothly, see `globals.css`). The button drifts
          // out from under the finger between mousedown and mouseup, and the
          // browser dispatches the `click` on the common ancestor instead: the
          // tap does nothing. Keeping focus where it is avoids the scroll.
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={onClick}
          className="flex items-center justify-center rounded-full bg-red-600 p-2 transition-colors hover:bg-red-700 active:scale-[98%] active:transition-transform"
        >
          <span className="sr-only">{label}</span>
          <Trash2 className="h-4 w-4 text-white" />
        </button>
      }
      content={tooltip}
    />
  );
}

interface DeleteIconButtonProps {
  /** What the button does, read out by screen readers, e.g. "Delete Invoice Item 2". */
  label: string;
  /** The tooltip shown on hover. Defaults to `label`. */
  tooltip?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
