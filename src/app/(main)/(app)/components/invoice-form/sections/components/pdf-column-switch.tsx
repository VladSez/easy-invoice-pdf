import { useId } from "react";
import {
  type Control,
  Controller,
  type FieldPathByValue,
} from "react-hook-form";

import type { InvoiceData, InvoiceItemData } from "@/app/schema";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CustomTooltip } from "@/components/ui/tooltip";

/**
 * The "In PDF" switch for one item column. Columns are switched on the first item only,
 * so the field path always points there.
 */
export function PdfColumnSwitch({
  control,
  column,
  ariaLabel,
  tooltip,
}: PdfColumnSwitchProps) {
  return (
    <InPdfSwitch
      control={control}
      name={`items.0.${column}`}
      ariaLabel={ariaLabel}
      tooltip={tooltip}
    />
  );
}

/** A compact "In PDF" switch for any boolean field that shows or hides part of the PDF. */
export function InPdfSwitch({
  control,
  name,
  ariaLabel,
  tooltip,
  testId,
}: InPdfSwitchProps) {
  const id = useId();

  return (
    <div className="inline-flex shrink-0 items-center gap-1.5">
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange, ...field } }) => {
          return (
            <Switch
              {...field}
              id={id}
              checked={value}
              onCheckedChange={onChange}
              size="sm"
              aria-label={ariaLabel}
              data-testid={testId}
            />
          );
        }}
      />
      <CustomTooltip
        trigger={
          <Label
            htmlFor={id}
            className="cursor-pointer whitespace-nowrap text-xs font-normal text-slate-600"
          >
            In PDF
          </Label>
        }
        content={tooltip}
      />
    </div>
  );
}

interface PdfColumnSwitchProps {
  control: Control<InvoiceData>;
  /** The item flag that shows or hides the column. */
  column: Extract<keyof InvoiceItemData, `${string}FieldIsVisible`>;
  /** Names the switch for assistive tech and tests, since every one reads "In PDF". */
  ariaLabel: string;
  /** Explains which column the switch controls. */
  tooltip: string;
}

interface InPdfSwitchProps {
  control: Control<InvoiceData>;
  /** The boolean field the switch toggles. */
  name: FieldPathByValue<InvoiceData, boolean>;
  /** Names the switch for assistive tech and tests, since every one reads "In PDF". */
  ariaLabel: string;
  /** Explains what the switch shows or hides. */
  tooltip: string;
  testId?: string;
}
