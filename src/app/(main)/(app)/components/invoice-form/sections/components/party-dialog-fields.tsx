import { Eye, EyeOff } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

interface PartyDialogSectionProps {
  title: string;
  /** Sits at the end of the heading row, e.g. the tax number's PDF toggle. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** A titled group of fields in the seller or buyer dialog, divided from the one above it. */
export function PartyDialogSection({
  title,
  action,
  children,
}: PartyDialogSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0"
    >
      <div className="flex min-h-[22px] items-center justify-between gap-2">
        <h3
          id={headingId}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

interface PdfVisibilityToggleProps {
  id: string;
  /** The field is printed on the invoice. */
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** The field's name as the accessible name says it, e.g. `Email`. */
  fieldLabel: string;
  "data-testid"?: string;
}

/**
 * Whether a field is printed, as a pill that says so ("Show in PDF" / "Hidden in PDF"). It is a
 * switch to assistive tech, like the "Show in PDF" switches in the invoice form.
 */
export function PdfVisibilityToggle({
  id,
  checked,
  onCheckedChange,
  fieldLabel,
  "data-testid": dataTestId,
}: PdfVisibilityToggleProps) {
  const Icon = checked ? Eye : EyeOff;

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={`Show the '${fieldLabel}' field in the PDF`}
      data-testid={dataTestId}
      title={checked ? "Printed on the invoice" : "Left out of the invoice"}
      onClick={() => {
        onCheckedChange(!checked);
      }}
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1",
        checked
          ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200/70",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {checked ? "Show in PDF" : "Hidden in PDF"}
    </button>
  );
}

interface GetPartyFieldClassNameOptions {
  /** The field is left out of the PDF. */
  isHidden?: boolean;
  /** The field was filled in from the invoice and not changed since. */
  isPrefilled?: boolean;
}

/** Fades fields the PDF leaves out, and tints the ones copied from the invoice. */
export function getPartyFieldClassName({
  isHidden = false,
  isPrefilled = false,
}: GetPartyFieldClassNameOptions) {
  // a hidden field is not printed, so whether it was copied matters less than that
  if (isHidden) {
    return "border-dashed bg-slate-50 text-slate-500";
  }

  return isPrefilled ? "border-green-300 bg-green-50/70" : "";
}
