import { Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";

import {
  ErrorMessage,
  hiddenInPdfClassName,
  inputErrorClassName,
} from "@/app/(main)/(app)/components/invoice-form/common";
import type { InvoiceData } from "@/app/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CustomTooltip } from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils";

/**
 * The item's Type of GTU, a Polish tax code most invoices never use: collapsed behind a
 * pill, like the discount. Adding a code turns the GTU column on, since a code is meant to
 * be printed, and removing the last one on the invoice turns it off again.
 */
export function ItemGtuField({
  control,
  index,
  errors,
  getValues,
  setValue,
}: ItemGtuFieldProps) {
  const [isOpen, setIsOpen] = useState(() => {
    return Boolean(getValues(`items.${index}.typeOfGTU`));
  });
  const pillRef = useRef<HTMLButtonElement>(null);
  const inputId = `itemTypeOfGTU${index}`;

  if (!isOpen) {
    return (
      <Button
        ref={pillRef}
        variant="outline"
        size="sm"
        className="h-[34px] rounded-full border-dashed border-slate-300 px-3 text-[13px] font-normal text-slate-600 shadow-none hover:border-slate-400 hover:bg-white hover:text-slate-950 max-md:h-10"
        onClick={() => {
          setIsOpen(true);
          setValue("items.0.typeOfGTUFieldIsVisible", true, {
            shouldDirty: true,
          });
          trackEvent({ event: "add_item_gtu" });

          // the card mounts in this click's render, so focus its input on the next frame
          requestAnimationFrame(() => {
            document.querySelector<HTMLElement>(`#${inputId}`)?.focus();
          });
        }}
        data-testid={`addItemGtu${index}`}
      >
        <Plus className="size-3.5" strokeWidth={2.25} />
        Type of GTU
      </Button>
    );
  }

  return (
    <OpenItemGtuField
      control={control}
      index={index}
      errors={errors}
      setValue={setValue}
      inputId={inputId}
      onRemove={() => {
        setValue(`items.${index}.typeOfGTU`, "", {
          shouldDirty: true,
          shouldValidate: !!errors.items?.[index]?.typeOfGTU,
        });

        const isAnyCodeLeft = getValues("items").some((item, itemIndex) => {
          return itemIndex !== index && Boolean(item.typeOfGTU);
        });

        if (!isAnyCodeLeft) {
          setValue("items.0.typeOfGTUFieldIsVisible", false, {
            shouldDirty: true,
          });
        }

        setIsOpen(false);
        trackEvent({ event: "remove_item_gtu" });

        // the card unmounts with the focused button in it, so hand focus to the pill
        requestAnimationFrame(() => {
          pillRef.current?.focus();
        });
      }}
    />
  );
}

/**
 * The open card. Its own component so only an item with a code open subscribes to the
 * column switch.
 */
function OpenItemGtuField({
  control,
  index,
  errors,
  setValue,
  inputId,
  onRemove,
}: OpenItemGtuFieldProps) {
  const switchId = useId();
  const headingId = useId();
  const itemError = errors.items?.[index]?.typeOfGTU;

  // The column switch lives on the first item. Watched and set rather than a second
  // `Controller` on the same field, as every open card shows it.
  const isColumnVisible = useWatch({
    control,
    name: "items.0.typeOfGTUFieldIsVisible",
  });

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3",
        hiddenInPdfClassName(!isColumnVisible),
      )}
      data-testid={`itemGtu${index}`}
    >
      <div className="-my-1 -me-1.5 flex items-center justify-between gap-2">
        <Label id={headingId} htmlFor={inputId} className="font-semibold">
          Type of GTU
        </Label>
        <div className="flex items-center gap-1">
          <div className="inline-flex shrink-0 items-center gap-1.5">
            <Switch
              id={switchId}
              checked={isColumnVisible}
              onCheckedChange={(checked) => {
                setValue("items.0.typeOfGTUFieldIsVisible", checked, {
                  shouldDirty: true,
                });
              }}
              size="sm"
              aria-label={`Show the 'Type of GTU' Column in the PDF for item ${index + 1}`}
            />
            <CustomTooltip
              trigger={
                <Label
                  htmlFor={switchId}
                  className="cursor-pointer whitespace-nowrap text-xs font-normal text-slate-600"
                >
                  In PDF
                </Label>
              }
              content="Show the Type of GTU column in the PDF, for every item"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[13px] font-normal text-slate-500 max-md:h-11"
            aria-label={`Remove Type of GTU from item ${index + 1}`}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>

      <Controller
        name={`items.${index}.typeOfGTU`}
        control={control}
        render={({ field }) => {
          return (
            <Input
              {...field}
              id={inputId}
              type="text"
              placeholder="e.g. GTU_01"
              className={cn(
                "h-[34px] max-md:h-11 max-md:text-base",
                inputErrorClassName(!!itemError),
              )}
            />
          );
        }}
      />
      {itemError ? <ErrorMessage>{itemError.message}</ErrorMessage> : null}
    </div>
  );
}

interface ItemGtuFieldProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  errors: FieldErrors<InvoiceData>;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
}

interface OpenItemGtuFieldProps extends Omit<ItemGtuFieldProps, "getValues"> {
  /** The code input's id, focused when the card opens. */
  inputId: string;
  /** Clears the code and collapses the card. */
  onRemove: () => void;
}
