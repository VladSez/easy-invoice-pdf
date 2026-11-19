import { useEffect, useId, useRef, useState } from "react";
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
import {
  AddPillButton,
  takeOpenOrder,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/add-pill-button";
import {
  type InvoiceData,
  type ItemDiscountType,
  type SupportedCurrencies,
  CURRENCY_SYMBOLS,
  MAX_ITEM_DISCOUNT_LABEL_LENGTH,
} from "@/app/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics/track-event";
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
  // where the card sits among the item's open cards, see `takeOpenOrder`
  const [openOrder, setOpenOrder] = useState(0);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) {
    return (
      <AddPillButton
        ref={addButtonRef}
        testId={`addItemDiscount${index}`}
        onClick={() => {
          setIsOpen(true);
          setOpenOrder(takeOpenOrder());
          setShouldFocusValue(true);
          trackEvent({ event: "add_item_discount" });
        }}
      >
        Add discount
      </AddPillButton>
    );
  }

  return (
    <OpenItemDiscountFields
      control={control}
      index={index}
      errors={errors}
      currency={currency}
      shouldFocusValue={shouldFocusValue}
      openOrder={openOrder}
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
        trackEvent({ event: "remove_item_discount" });

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
 * The open discount card. Its own component so that only an item whose discount is open
 * subscribes to the discount type and the calculated amount: a collapsed item would
 * otherwise re-render on every keystroke in its unit price just to show the same button.
 * What the discount takes off shows in the item's amounts card underneath.
 */
function OpenItemDiscountFields({
  control,
  index,
  errors,
  currency,
  shouldFocusValue,
  openOrder,
  setValue,
  onRemove,
}: OpenItemDiscountFieldsProps) {
  // Focus the value once, as the section opens, and only then: the ref holds what was true
  // at mount, so moving the item (a new `index`) does not refocus it.
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
  const amount = useWatch({ control, name: `items.${index}.amount` });
  const netPrice = useWatch({ control, name: `items.${index}.netPrice` });

  // Read from the fields rather than the calculated amounts, which only catch up after
  // the totals effect runs, so the message does not flash while typing
  const isLineTotalZero =
    // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `<Input type="number">` gives back strings at runtime, the schema types say number
    (Number(amount) || 0) * (Number(netPrice) || 0) === 0;

  const itemErrors = errors.items?.[index];

  const typeLabelId = useId();

  return (
    <div
      role="group"
      aria-labelledby={`itemDiscountHeading${index}`}
      className="flex w-full flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3"
      style={{ order: openOrder }}
      data-testid={`itemDiscount${index}`}
    >
      <div className="-my-1 -me-1.5 flex items-center justify-between">
        <span id={`itemDiscountHeading${index}`} className="font-semibold">
          Discount
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[13px] font-normal text-slate-500 max-md:h-11"
          aria-label="Remove discount"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2.5">
        <div className="shrink-0">
          <span
            id={typeLabelId}
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Type
          </span>
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

                trackEvent({
                  event: "change_item_discount_type",
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
                  aria-labelledby={typeLabelId}
                  className="inline-flex h-[34px] shrink-0 overflow-hidden rounded-lg border border-gray-300 bg-white max-md:h-11"
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
                          // no transition: a segmented control should switch instantly
                          "h-full whitespace-nowrap px-2.5 text-[13px]",
                          optionIndex > 0 && "border-l border-gray-200",
                          isSelected
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                        )}
                      >
                        {option.value === "amount"
                          ? `${CURRENCY_SYMBOLS[currency] || currency} Amount`
                          : option.text}
                      </button>
                    );
                  })}
                </div>
              );
            }}
          />
        </div>

        <div className="w-24 shrink-0">
          <Label
            htmlFor={`itemDiscountValue${index}`}
            className="mb-1 block text-xs text-slate-700"
          >
            Value
          </Label>
          {/* Discount value */}
          <Controller
            name={`items.${index}.discountValue`}
            control={control}
            render={({ field }) => {
              return (
                <div className="relative">
                  <Input
                    {...field}
                    // the stored zero of an item without a discount shows as the empty
                    // placeholder, so typing "10" gives 10 rather than "010". Only the
                    // number 0: a typed "0" or "0." is a string and stays, and the schema
                    // reads "" back as 0
                    value={field.value === 0 ? "" : field.value}
                    id={`itemDiscountValue${index}`}
                    aria-label="Discount value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={discountType === "percentage" ? "100" : undefined}
                    placeholder="0"
                    className={cn(
                      "h-[34px] pe-8 tabular-nums max-md:h-11 max-md:text-base",
                      inputErrorClassName(!!itemErrors?.discountValue),
                    )}
                    data-testid={`itemDiscountValue${index}`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-sm text-slate-500">
                    {discountType === "amount"
                      ? CURRENCY_SYMBOLS[currency] || currency
                      : "%"}
                  </span>
                </div>
              );
            }}
          />
        </div>

        <div className="min-w-[150px] flex-1">
          <Label
            htmlFor={`itemDiscountLabel${index}`}
            className="mb-1 block text-xs text-slate-700"
          >
            Label in PDF{" "}
            <span className="font-normal text-slate-500">(optional)</span>
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
                  placeholder="e.g. Loyalty discount"
                  className={cn(
                    "h-[34px] max-md:h-11 max-md:text-base",
                    inputErrorClassName(!!itemErrors?.discountLabel),
                  )}
                />
              );
            }}
          />
        </div>
      </div>

      {itemErrors?.discountValue ? (
        <ErrorMessage>{itemErrors.discountValue.message}</ErrorMessage>
      ) : discountAmount > 0 ? null : (
        <InputHelperMessage>
          {isLineTotalZero
            ? "The line total (Qty × Unit price) is 0, so there's nothing to discount yet."
            : discountType === "amount"
              ? "Enter an amount up to the line total. It applies once to the whole line, not per unit."
              : "Enter a percentage from 0 to 100. It applies to the line total, before tax."}
        </InputHelperMessage>
      )}
      {itemErrors?.discountLabel ? (
        <ErrorMessage>{itemErrors.discountLabel.message}</ErrorMessage>
      ) : null}
    </div>
  );
}

const DISCOUNT_TYPE_OPTIONS = [
  { value: "percentage", text: "% Percent", ariaLabel: "Percentage" },
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
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
}

interface OpenItemDiscountFieldsProps extends Omit<
  ItemDiscountFieldsProps,
  "getValues"
> {
  /** Focus the value input on mount: the user just opened the section. */
  shouldFocusValue: boolean;
  /** The card's CSS `order` among the item's open cards, from `takeOpenOrder`. */
  openOrder: number;
  /** Clears the discount and collapses the section. */
  onRemove: () => void;
}
