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
import {
  AddPillButton,
  takeOpenOrder,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/add-pill-button";
import type { InvoiceData } from "@/app/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CustomTooltip } from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils";

/**
 * The item's value in the invoice's custom column, a column the user names themselves (a
 * project code, a SKU, a PO line), collapsed behind a pill like the discount.
 *
 * The column is one for the whole table: its name (`customColumnLabel`) is shared, and
 * each item has its own value (`typeOfGTU`, the name the column had when it was the Polish
 * Type of GTU). The first card to open asks for the name, and item 1's card always shows
 * it so it can be renamed; once named, the other items' pills read "+ <name>". Adding a
 * value turns the column on in the PDF, and removing the last one takes it out and forgets
 * the name.
 */
export function ItemCustomColumnField({
  control,
  index,
  errors,
  getValues,
  setValue,
}: ItemCustomColumnFieldProps) {
  const [isOpen, setIsOpen] = useState(() => {
    return Boolean(getValues(`items.${index}.typeOfGTU`));
  });
  // where the card sits among the item's open cards, see `takeOpenOrder`
  const [openOrder, setOpenOrder] = useState(0);
  // whether this card asks for the column's name: item 1's always does, and so does the
  // card that adds a column that has no name yet. Fixed when the card opens, so the field
  // doesn't vanish the moment a name is typed into it.
  const [asksForName, setAsksForName] = useState(index === 0);
  const pillRef = useRef<HTMLButtonElement>(null);

  const columnName = useWatch({ control, name: "customColumnLabel" })?.trim();

  const nameInputId = `itemCustomColumnName${index}`;
  const valueInputId = `itemTypeOfGTU${index}`;

  if (!isOpen) {
    return (
      <AddPillButton
        ref={pillRef}
        testId={`addItemCustomColumn${index}`}
        onClick={() => {
          const isUnnamed = !getValues("customColumnLabel")?.trim();
          const willAskForName = index === 0 || isUnnamed;

          setIsOpen(true);
          setAsksForName(willAskForName);
          setOpenOrder(takeOpenOrder());
          setValue("items.0.typeOfGTUFieldIsVisible", true, {
            shouldDirty: true,
          });
          trackEvent({ event: "add_item_custom_column" });

          // the card mounts in this click's render, so focus its first field on the next
          // frame: the name while the column has none, otherwise the value
          requestAnimationFrame(() => {
            document
              .querySelector<HTMLElement>(
                `#${willAskForName && isUnnamed ? nameInputId : valueInputId}`,
              )
              ?.focus();
          });
        }}
      >
        {columnName || "Custom column"}
      </AddPillButton>
    );
  }

  return (
    <OpenItemCustomColumnField
      control={control}
      index={index}
      errors={errors}
      setValue={setValue}
      columnName={columnName ?? ""}
      asksForName={asksForName}
      nameInputId={nameInputId}
      valueInputId={valueInputId}
      openOrder={openOrder}
      onRemove={() => {
        setValue(`items.${index}.typeOfGTU`, "", {
          shouldDirty: true,
          shouldValidate: !!errors.items?.[index]?.typeOfGTU,
        });

        const isAnyValueLeft = getValues("items").some((item, itemIndex) => {
          return itemIndex !== index && Boolean(item.typeOfGTU);
        });

        // the last value gone, the column goes too: out of the PDF, and its name forgotten
        // so the other items' pills go back to "+ Custom column"
        if (!isAnyValueLeft) {
          setValue("items.0.typeOfGTUFieldIsVisible", false, {
            shouldDirty: true,
          });
          setValue("customColumnLabel", "", { shouldDirty: true });
        }

        setIsOpen(false);
        trackEvent({ event: "remove_item_custom_column" });

        // the card unmounts with the focused button in it, so hand focus to the pill
        requestAnimationFrame(() => {
          pillRef.current?.focus();
        });
      }}
    />
  );
}

/**
 * The open card. Its own component so only an item with the card open subscribes to the
 * column switch.
 */
function OpenItemCustomColumnField({
  control,
  index,
  errors,
  setValue,
  columnName,
  asksForName,
  nameInputId,
  valueInputId,
  openOrder,
  onRemove,
}: OpenItemCustomColumnFieldProps) {
  const switchId = useId();
  const headingId = useId();
  const valueError = errors.items?.[index]?.typeOfGTU;
  const nameError = errors.customColumnLabel;

  // The column switch lives on the first item. Watched and set rather than a second
  // `Controller` on the same field, as every open card shows it.
  const isColumnVisible = useWatch({
    control,
    name: "items.0.typeOfGTUFieldIsVisible",
  });

  // a card that asks for the name is the column's own card; the others are its value
  const title = asksForName ? "Custom column" : columnName || "Type of GTU";

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3",
        hiddenInPdfClassName(!isColumnVisible),
      )}
      style={{ order: openOrder }}
      data-testid={`itemCustomColumn${index}`}
    >
      <div className="-my-1 -me-1.5 flex items-center justify-between gap-2">
        {/* wraps rather than cutting off: the switch and Remove leave it little room on phones */}
        <span id={headingId} className="min-w-0 break-words font-semibold">
          {title}
        </span>
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
              aria-label={`Show the custom column in the PDF for item ${index + 1}`}
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
              content="Show the custom column in the PDF, for every item"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[13px] font-normal text-slate-500 max-md:h-11"
            aria-label={`Remove the custom column value from item ${index + 1}`}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>

      {asksForName ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={nameInputId}>Column name</Label>
          <Controller
            name="customColumnLabel"
            control={control}
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={nameInputId}
                  type="text"
                  placeholder="e.g. Project code, SKU, PO line"
                  maxLength={30}
                  className={cn(
                    "h-[34px] max-md:h-11 max-md:text-base",
                    inputErrorClassName(!!nameError),
                  )}
                />
              );
            }}
          />
          {nameError ? (
            <ErrorMessage>{nameError.message}</ErrorMessage>
          ) : columnName ? (
            <p className="text-xs text-slate-500">
              Heads the column in the PDF, for every item.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Heads the column in the PDF, for every item. Left empty, it prints
              &ldquo;Type of GTU&rdquo;.
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        {asksForName ? <Label htmlFor={valueInputId}>Value</Label> : null}
        <Controller
          name={`items.${index}.typeOfGTU`}
          control={control}
          render={({ field }) => {
            return (
              <Input
                {...field}
                id={valueInputId}
                type="text"
                aria-label={asksForName ? undefined : title}
                placeholder="This item's value"
                maxLength={50}
                className={cn(
                  "h-[34px] max-md:h-11 max-md:text-base",
                  inputErrorClassName(!!valueError),
                )}
              />
            );
          }}
        />
        {valueError ? <ErrorMessage>{valueError.message}</ErrorMessage> : null}
      </div>
    </div>
  );
}

interface ItemCustomColumnFieldProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  errors: FieldErrors<InvoiceData>;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
}

interface OpenItemCustomColumnFieldProps extends Omit<
  ItemCustomColumnFieldProps,
  "getValues"
> {
  /** The column's name, trimmed; "" while it has none. */
  columnName: string;
  /** This card asks for the column's name, on top of the item's value. */
  asksForName: boolean;
  /** The name input's id, focused when the card opens on an unnamed column. */
  nameInputId: string;
  /** The value input's id, focused when the card opens on a named column. */
  valueInputId: string;
  /** The card's CSS `order` among the item's open cards, from `takeOpenOrder`. */
  openOrder: number;
  /** Clears the value and collapses the card. */
  onRemove: () => void;
}
