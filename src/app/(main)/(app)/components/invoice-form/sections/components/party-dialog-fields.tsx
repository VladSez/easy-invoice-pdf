import { useId } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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

/** Whether a field is printed: the same small "Show in PDF" switch as the invoice form. */
export function PdfVisibilityToggle({
  id,
  checked,
  onCheckedChange,
  fieldLabel,
  "data-testid": dataTestId,
}: PdfVisibilityToggleProps) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        size="sm"
        aria-label={`Show the '${fieldLabel}' field in the PDF`}
        data-testid={dataTestId}
      />
      <Label htmlFor={id} className="cursor-pointer">
        Show in PDF
      </Label>
    </div>
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
