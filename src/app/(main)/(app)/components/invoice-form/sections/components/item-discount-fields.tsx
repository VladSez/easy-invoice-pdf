import {
  formatMoneyForTemplate,
  type InvoiceData,
  type ItemDiscountType,
  MAX_ITEM_DISCOUNT_LABEL_LENGTH,
  type SupportedCurrencies,
  type SupportedNumberFormatLocale,
} from "@easyinvoicepdf/invoice-core";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  inputErrorClassName,
} from "@/app/(main)/(app)/components/invoice-form/common";
import { DeleteIconButton } from "@/app/(main)/(app)/components/invoice-form/sections/components/delete-icon-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";

/**
 * The per-item discount: collapsed behind an "Add discount" button, since most invoices
 * have none, and open with a type switch (% or fixed amount), the value and an optional
 * label. Removing it resets the fields, so a closed section never leaves a discount behind.
 */
export function ItemDiscountFields({
  control,
  index,
  errors,
  currency,
  template,
  numberFormatLocale,
  getValues,
  setValue,
}: ItemDiscountFieldsProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const item = getValues(`items.${index}`);

    // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `<Input type="number">` gives back a string at runtime, the schema type says number
    return Number(item?.discountValue) > 0 || Boolean(item?.discountLabel);
  });
  // focus the value input only when the user opens the section, not when it mounts open
  // for an item that already has a discount (a restored invoice, a shared link)
  const [shouldFocusValue, setShouldFocusValue] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) {
    return (
      <Button
        ref={addButtonRef}
        variant="default"
        size="sm"
        className="gap-1.5"
        onClick={() => {
          setIsOpen(true);
          setShouldFocusValue(true);
          umamiTrackEvent("add_item_discount");
        }}
        data-testid={`addItemDiscount${index}`}
      >
        <Plus className="size-3.5" />
        Add discount
      </Button>
    );
  }

  return (
    <OpenItemDiscountFields
      control={control}
      index={index}
      errors={errors}
      currency={currency}
      template={template}
      numberFormatLocale={numberFormatLocale}
      shouldFocusValue={shouldFocusValue}
      setValue={setValue}
      onRemove={() => {
        // validate only to clear an error: a validating `setValue` re-renders the whole
        // form in the click's task, see `selectDiscountType`
        setValue(`items.${index}.discountValue`, 0, {
          shouldValidate: !!errors.items?.[index]?.discountValue,
        });
        setValue(`items.${index}.discountLabel`, "");
        setValue(`items.${index}.discountType`, "percentage");
        setIsOpen(false);
        umamiTrackEvent("remove_item_discount");

        // the section unmounts with the focused button in it, so hand focus to the
        // "Add discount" button that takes its place
        requestAnimationFrame(() => {
          addButtonRef.current?.focus();
        });
      }}
    />
  );
}

/**
 * The open discount section. Its own component so that only an item whose discount is
 * open subscribes to the discount type and the calculated amounts: a collapsed item would
 * otherwise re-render on every keystroke in its net price just to show the same button.
 */
function OpenItemDiscountFields({
  control,
  index,
  errors,
  currency,
  template,
  numberFormatLocale,
  shouldFocusValue,
  setValue,
  onRemove,
}: OpenItemDiscountFieldsProps) {
  // Focus the value once, as the section opens. Not `autoFocus`: switching the type swaps
  // the value input for another one, which would take focus off the type switch. The ref
  // holds what was true at mount, so moving the item (a new `index`) does not refocus it.
  const focusOnMountRef = useRef({ shouldFocusValue, index });

  useEffect(() => {
    const { shouldFocusValue: shouldFocus, index: mountIndex } =
      focusOnMountRef.current;

    if (shouldFocus) {
      document
        .querySelector<HTMLElement>(`#itemDiscountValue${mountIndex}`)
        ?.focus();
    }
  }, []);

  const discountType = useWatch({
    control,
    name: `items.${index}.discountType`,
  });
  const discountAmount = useWatch({
    control,
    name: `items.${index}.discountAmount`,
  });
  const netAmount = useWatch({ control, name: `items.${index}.netAmount` });
  const amount = useWatch({ control, name: `items.${index}.amount` });
  const netPrice = useWatch({ control, name: `items.${index}.netPrice` });

  // Read from the fields rather than the calculated amounts, which only catch up after
  // the totals effect runs, so the message does not flash while typing
  const isLineTotalZero =
    // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `<Input type="number">` gives back strings at runtime, the schema types say number
    (Number(amount) || 0) * (Number(netPrice) || 0) === 0;

  const itemErrors = errors.items?.[index];

  const formatMoney = (amount: number) => {
    return formatMoneyForTemplate({
      amount,
      currency,
      numberFormatLocale,
      template,
    });
  };

  return (
    <fieldset
      className="relative rounded-md border px-4 pb-4"
      data-testid={`itemDiscount${index}`}
    >
      <legend className="text-base font-semibold lg:text-lg">Discount</legend>

      {/* Remove discount button, the same one that deletes an invoice item */}
      <div className="absolute -right-3 -top-8">
        <DeleteIconButton
          label="Remove discount"
          tooltip={`Remove discount from Invoice Item ${index + 1}`}
          onClick={onRemove}
        />
      </div>

      <div className="space-y-4">
        <div className="mt-4">
          <Label htmlFor={`itemDiscountValue${index}`}>Discount value</Label>

          <div className="mt-1 flex items-start gap-2">
            {/* Discount type: percentage or fixed amount */}
            <Controller
              name={`items.${index}.discountType`}
              control={control}
              render={({ field }) => {
                // a value means something else under the other type (10% is not 10.00),
                // so switching starts the value over rather than reinterpreting it
                const selectDiscountType = (nextType: ItemDiscountType) => {
                  if (nextType === field.value) return;

                  field.onChange(nextType);

                  umamiTrackEvent("change_item_discount_type", {
                    data: { discount_type: nextType },
                  });
                  // Validate only to clear an error the old value left behind. A
                  // validating `setValue` publishes new form errors, which re-renders the
                  // whole form in the same task as the click and makes the switch flicker.
                  setValue(`items.${index}.discountValue`, 0, {
                    shouldValidate: !!itemErrors?.discountValue,
                  });
                };

                return (
                  <div
                    role="radiogroup"
                    aria-label={`Discount type for item ${index + 1}`}
                    className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-lg border border-gray-300 bg-slate-100 p-1"
                  >
                    {DISCOUNT_TYPE_OPTIONS.map((option, optionIndex) => {
                      const isSelected = field.value === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={option.ariaLabel}
                          // one tab stop for the group, arrows move between the options,
                          // as in a native radio group
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => {
                            selectDiscountType(option.value);
                          }}
                          onKeyDown={(event) => {
                            const step = ARROW_KEY_STEPS[event.key];

                            if (!step) return;

                            event.preventDefault();

                            const nextIndex =
                              (optionIndex +
                                step +
                                DISCOUNT_TYPE_OPTIONS.length) %
                              DISCOUNT_TYPE_OPTIONS.length;

                            selectDiscountType(
                              DISCOUNT_TYPE_OPTIONS[nextIndex].value,
                            );
                            const radios =
                              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                                '[role="radio"]',
                              );

                            radios?.[nextIndex]?.focus();
                          }}
                          className={cn(
                            // no transition: a fading background under a shadow that moves at once
                            // reads as a flicker, and a segmented control should switch instantly
                            "h-full min-w-7 rounded-md px-1.5 text-xs font-medium tabular-nums",
                            isSelected
                              ? "bg-white text-slate-950 shadow-sm"
                              : "text-slate-600 hover:text-slate-950",
                          )}
                        >
                          {option.value === "amount" ? currency : option.text}
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            />

            {/* Discount value */}
            <Controller
              name={`items.${index}.discountValue`}
              control={control}
              render={({ field }) => {
                const inputProps = {
                  ...field,
                  // the stored zero of an item without a discount shows as the empty
                  // placeholder, so typing "10" gives 10 rather than "010". Only the number
                  // 0: a typed "0" or "0." is a string and stays, and the schema reads ""
                  // back as 0
                  value: field.value === 0 ? "" : field.value,
                  id: `itemDiscountValue${index}`,
                  className: cn(
                    "w-full",
                    inputErrorClassName(!!itemErrors?.discountValue),
                  ),
                } as const;

                return discountType === "amount" ? (
                  <div className="w-full">
                    <MoneyInput
                      {...inputProps}
                      type="number"
                      step="0.01"
                      min="0"
                      currency={currency}
                      dataTestId={`itemDiscountValue${index}`}
                    />
                  </div>
                ) : (
                  <div className="relative w-full">
                    <Input
                      {...inputProps}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0"
                      className={cn(inputProps.className, "pe-8")}
                      data-testid={`itemDiscountValue${index}`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-sm text-slate-600">
                      %
                    </span>
                  </div>
                );
              }}
            />
          </div>

          {itemErrors?.discountValue ? (
            <ErrorMessage>{itemErrors.discountValue.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              {discountAmount > 0 ? (
                <>
                  −{formatMoney(discountAmount)} off. Net after discount:{" "}
                  {formatMoney(netAmount)}.
                  <br />
                  Tax is calculated after the discount.
                </>
              ) : isLineTotalZero ? (
                "The line total (Amount × Net Price) is 0, so there's nothing to discount yet."
              ) : discountType === "amount" ? (
                "Enter an amount up to the line total. It applies once to the whole line, not per unit."
              ) : (
                "Enter a percentage from 0 to 100. It applies to the line total, before tax."
              )}
            </InputHelperMessage>
          )}
        </div>

        {/* Discount label */}
        <div>
          <Label htmlFor={`itemDiscountLabel${index}`}>
            Label <span className="font-normal text-slate-500">(optional)</span>
          </Label>
          <Controller
            name={`items.${index}.discountLabel`}
            control={control}
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  id={`itemDiscountLabel${index}`}
                  type="text"
                  maxLength={MAX_ITEM_DISCOUNT_LABEL_LENGTH}
                  placeholder="e.g. Charitable donation"
                  className={cn(
                    "mt-1",
                    inputErrorClassName(!!itemErrors?.discountLabel),
                  )}
                />
              );
            }}
          />
          {itemErrors?.discountLabel ? (
            <ErrorMessage>{itemErrors.discountLabel.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Shown next to the discount in the PDF. Leave empty to show
              &quot;Discount&quot; in the invoice language.
            </InputHelperMessage>
          )}
        </div>
      </div>
    </fieldset>
  );
}

const DISCOUNT_TYPE_OPTIONS = [
  { value: "percentage", text: "%", ariaLabel: "Percentage" },
  { value: "amount", text: "", ariaLabel: "Fixed amount" },
] as const satisfies ReadonlyArray<{
  value: ItemDiscountType;
  text: string;
  ariaLabel: string;
}>;

/** How far each arrow key moves the selection in the discount type switch. */
const ARROW_KEY_STEPS: Partial<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
};

interface ItemDiscountFieldsProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  errors: FieldErrors<InvoiceData>;
  currency: SupportedCurrencies;
  template: InvoiceData["template"];
  /** The invoice's number format, already resolved against its language. */
  numberFormatLocale: SupportedNumberFormatLocale;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
}

interface OpenItemDiscountFieldsProps extends Omit<
  ItemDiscountFieldsProps,
  "getValues"
> {
  /** Focus the value input on mount: the user just opened the section. */
  shouldFocusValue: boolean;
  /** Clears the discount and collapses the section. */
  onRemove: () => void;
}
