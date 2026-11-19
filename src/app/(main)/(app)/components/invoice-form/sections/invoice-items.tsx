import { Copy, Minus, Plus, Trash2 } from "lucide-react";
import { memo, useId, useRef, useState } from "react";
import {
  type Control,
  Controller,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFieldArrayInsert,
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
  DeleteInvoiceItemDialog,
  type ItemPendingDeletion,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/delete-invoice-item-dialog";
import { ItemAmountsCard } from "@/app/(main)/(app)/components/invoice-form/sections/components/item-amounts-card";
import { ItemCustomColumnField } from "@/app/(main)/(app)/components/invoice-form/sections/components/item-custom-column-field";
import { ItemDiscountFields } from "@/app/(main)/(app)/components/invoice-form/sections/components/item-discount-fields";
import { PdfColumnSwitch } from "@/app/(main)/(app)/components/invoice-form/sections/components/pdf-column-switch";
import { formatMoneyForTemplate } from "@/app/(main)/(app)/utils/format-money-for-template";
import {
  type InvoiceData,
  type InvoiceItemData,
  type SupportedCurrencies,
  type SupportedLanguages,
  type SupportedNumberFormatLocale,
  MAX_INVOICE_ITEMS,
} from "@/app/schema";
import { Legend } from "@/components/legend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils";
import {
  getAmountInWords,
  getNumberFractionalPart,
} from "@/utils/invoice.utils";

export const InvoiceItems = memo(function InvoiceItems({
  control,
  fields,
  handleRemoveInvoiceItem,
  errors,
  currency,
  append,
  insert,
  template,
  taxLabelText,
  numberFormatLocale,
  language,
  getValues,
  setValue,
}: InvoiceItemsSettingsProps) {
  const [itemPendingDeletion, setItemPendingDeletion] =
    useState<ItemPendingDeletion | null>(null);
  const addItemButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const hasReachedItemLimit = fields.length >= MAX_INVOICE_ITEMS;
  const canDeleteItems = fields.length > 1;

  // the first item's switches show or hide a column for every item, so each item's field
  // is faded when its column is left out of the PDF
  const [
    isNameVisible,
    isAmountVisible,
    isUnitVisible,
    isNetPriceVisible,
    isVatVisible,
    isNetAmountVisible,
    isVatAmountVisible,
    isPreTaxAmountVisible,
  ] = useWatch({
    control,
    name: [
      "items.0.nameFieldIsVisible",
      "items.0.amountFieldIsVisible",
      "items.0.unitFieldIsVisible",
      "items.0.netPriceFieldIsVisible",
      "items.0.vatFieldIsVisible",
      "items.0.netAmountFieldIsVisible",
      "items.0.vatAmountFieldIsVisible",
      "items.0.preTaxAmountFieldIsVisible",
    ],
  });
  // most column switches exist on the default template only; the Stripe one prints them all
  const isDefaultTemplate = template === "default";

  const isNameHidden = isDefaultTemplate && !isNameVisible;

  const isAmountHidden = isDefaultTemplate && !isAmountVisible;

  const isUnitHidden = !isUnitVisible;

  const isNetPriceHidden = isDefaultTemplate && !isNetPriceVisible;

  const isVatHidden = !isVatVisible;

  const hiddenAmountColumns = {
    netAmount: isDefaultTemplate && !isNetAmountVisible,
    vatAmount: isDefaultTemplate && !isVatAmountVisible,
    preTaxAmount: isDefaultTemplate && !isPreTaxAmountVisible,
  };

  return (
    <>
      {fields.map((field, index) => {
        const isFirstItem = index === 0;
        const itemNumber = index + 1;
        const itemErrors = errors.items?.[index];

        // every template prints the unit and tax columns, so their switches show on both
        const showColumnSwitches = isFirstItem;
        const showDefaultTemplateColumnSwitches =
          isFirstItem && isDefaultTemplate;

        return (
          <fieldset
            key={field.id}
            data-item-card={index}
            // a plain block: WebKit (Safari, and Chrome on iOS) lays out a flex fieldset's
            // legend wrong and breaks the top border around it, so the layout is inside
            className="mb-4 rounded-xl border px-4 pb-4 pt-1 shadow-sm"
          >
            <Legend className="px-1 text-base font-semibold text-gray-900">
              Item {itemNumber}
            </Legend>

            <div className="flex flex-col gap-5">
              <div className="-mt-1 mb-1.5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-gray-300 px-2.5 text-[13px] font-normal text-slate-700 shadow-none max-md:h-7 max-md:px-2 max-md:text-xs"
                  disabled={hasReachedItemLimit}
                  aria-label={`Duplicate Invoice Item ${itemNumber}`}
                  onClick={() => {
                    // no focus: focusing the copy's first field scrolls to it and, on a
                    // phone, opens the keyboard, which pushed the page far past the copy
                    insert(index + 1, getValues(`items.${index}`), {
                      shouldFocus: false,
                    });
                    trackEvent({ event: "duplicate_invoice_item" });

                    // bring the copy to the top of the form's scroll box, so it's in view
                    requestAnimationFrame(() => {
                      scrollItemCardIntoView(index + 1);
                    });
                  }}
                >
                  <Copy className="size-3.5" />
                  Duplicate
                </Button>
                {canDeleteItems ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 border-red-200 px-2.5 text-[13px] font-normal text-red-700 shadow-none hover:border-red-300 hover:bg-red-50 hover:text-red-700 max-md:h-7 max-md:px-2 max-md:text-xs"
                    aria-label={`Delete Invoice Item ${itemNumber}`}
                    onClick={(event) => {
                      // Radix returns focus to its `Trigger` on close, and this dialog is
                      // controlled rather than triggered, so remember the button ourselves.
                      deleteTriggerRef.current = event.currentTarget;

                      // Read the name from the form rather than from the parent's debounced
                      // copy of it, so the dialog names what the user is actually looking at.
                      setItemPendingDeletion({
                        index,
                        name: getValues(`items.${index}.name`),
                      });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                ) : null}
              </div>

              {/* Name */}
              <div className={hiddenInPdfClassName(isNameHidden)}>
                <FieldHeader
                  htmlFor={`itemName${index}`}
                  label="Name"
                  columnSwitch={
                    showDefaultTemplateColumnSwitches ? (
                      <PdfColumnSwitch
                        control={control}
                        column="nameFieldIsVisible"
                        ariaLabel={`Show the 'Name of Goods/Service' Column in the PDF for item ${itemNumber}`}
                        tooltip="Show the 'Name of Goods/Service' Column in the PDF"
                      />
                    ) : null
                  }
                />
                <Controller
                  name={`items.${index}.name`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <Textarea
                        {...field}
                        rows={2}
                        id={`itemName${index}`}
                        className={inputErrorClassName(!!itemErrors?.name)}
                      />
                    );
                  }}
                />
                {itemErrors?.name ? (
                  <ErrorMessage>{itemErrors.name.message}</ErrorMessage>
                ) : null}
              </div>

              {/* Quantity */}
              <div className={hiddenInPdfClassName(isAmountHidden)}>
                <FieldHeader
                  htmlFor={`itemAmount${index}`}
                  label="Qty"
                  columnSwitch={
                    showDefaultTemplateColumnSwitches ? (
                      <PdfColumnSwitch
                        control={control}
                        column="amountFieldIsVisible"
                        ariaLabel={`Show the 'Amount' Column in the PDF for item ${itemNumber}`}
                        tooltip='Show the "Amount" Column in the PDF'
                      />
                    ) : null
                  }
                />
                <QuantityStepper
                  control={control}
                  index={index}
                  hasError={!!itemErrors?.amount}
                />
                {itemErrors?.amount ? (
                  <ErrorMessage>{itemErrors.amount.message}</ErrorMessage>
                ) : null}
              </div>

              {/* Unit, with one-tap common units under it */}
              <div className="flex flex-col gap-2">
                <div className={hiddenInPdfClassName(isUnitHidden)}>
                  <FieldHeader
                    htmlFor={`itemUnit${index}`}
                    label="Unit"
                    columnSwitch={
                      showColumnSwitches ? (
                        <PdfColumnSwitch
                          control={control}
                          column="unitFieldIsVisible"
                          ariaLabel={`Show the 'Unit' Column in the PDF for item ${itemNumber}`}
                          tooltip='Show the "Unit" Column in the PDF'
                        />
                      ) : null
                    }
                  />
                  <Controller
                    name={`items.${index}.unit`}
                    control={control}
                    render={({ field }) => {
                      return (
                        <Input
                          {...field}
                          id={`itemUnit${index}`}
                          type="text"
                          placeholder="e.g. hours"
                          className={cn(
                            "h-9 max-md:text-base",
                            inputErrorClassName(!!itemErrors?.unit),
                          )}
                        />
                      );
                    }}
                  />
                  {itemErrors?.unit ? (
                    <ErrorMessage>{itemErrors.unit.message}</ErrorMessage>
                  ) : null}
                </div>

                <UnitChips
                  control={control}
                  index={index}
                  setValue={setValue}
                  hasError={!!itemErrors?.unit}
                />
              </div>

              {/* Unit price */}
              <div className={hiddenInPdfClassName(isNetPriceHidden)}>
                <FieldHeader
                  htmlFor={`itemNetPrice${index}`}
                  label="Unit price"
                  columnSwitch={
                    showDefaultTemplateColumnSwitches ? (
                      <PdfColumnSwitch
                        control={control}
                        column="netPriceFieldIsVisible"
                        ariaLabel={`Show the 'Net Price' Column in the PDF for item ${itemNumber}`}
                        tooltip='Show the "Net Price" Column in the PDF'
                      />
                    ) : null
                  }
                />
                <Controller
                  name={`items.${index}.netPrice`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <>
                        <MoneyInput
                          {...field}
                          id={`itemNetPrice${index}`}
                          currency={currency}
                          type="number"
                          step="0.01"
                          min="0"
                          className={cn(
                            "h-9 w-full max-md:text-base",
                            inputErrorClassName(!!itemErrors?.netPrice),
                          )}
                          dataTestId={`itemNetPrice${index}`}
                        />
                        {itemErrors?.netPrice ? null : (
                          <UnitPricePreview
                            value={field.value}
                            currency={currency}
                            numberFormatLocale={numberFormatLocale}
                            template={template}
                            language={language}
                          />
                        )}
                      </>
                    );
                  }}
                />
                {itemErrors?.netPrice ? (
                  <ErrorMessage>{itemErrors.netPrice.message}</ErrorMessage>
                ) : null}
              </div>

              {/* Tax settings: the shared label on the first item, then this item's rate.
                One field per row under fixed labels, so a long tax name can't push
                the fields out of line */}
              <div
                role="group"
                aria-labelledby={`itemTaxSettings${index}`}
                className="flex flex-col gap-3"
              >
                <span
                  id={`itemTaxSettings${index}`}
                  className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500"
                >
                  Tax settings
                </span>

                {isFirstItem ? (
                  <div>
                    <Label htmlFor="taxLabelText" className="mb-1.5 block">
                      Label
                    </Label>
                    <Controller
                      name="taxLabelText"
                      control={control}
                      render={({ field }) => {
                        return (
                          <Input
                            {...field}
                            type="text"
                            id="taxLabelText"
                            // the visible "Label" means little out of context
                            aria-label="Tax label"
                            placeholder="e.g. VAT, GST, Sales Tax"
                            className={cn(
                              "h-9 max-md:text-base",
                              inputErrorClassName(!!errors.taxLabelText),
                            )}
                          />
                        );
                      }}
                    />
                    {errors.taxLabelText ? (
                      <ErrorMessage>{errors.taxLabelText.message}</ErrorMessage>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className={cn(
                    "flex flex-col gap-2",
                    hiddenInPdfClassName(isVatHidden),
                  )}
                  data-testid={`itemVat${index}`}
                >
                  <div>
                    {/* The switch hides only the rate column, so it sits on the rate: the
                      label still names the amount column and the summary table. Later items
                      have no label field above, so their rate names the tax. */}
                    <FieldHeader
                      htmlFor={`itemVat${index}`}
                      label={isFirstItem ? "Rate" : `${taxLabelText} rate`}
                      columnSwitch={
                        showColumnSwitches ? (
                          <PdfColumnSwitch
                            control={control}
                            column="vatFieldIsVisible"
                            ariaLabel={`Show the '${taxLabelText}' Column in the PDF for item ${itemNumber}`}
                            tooltip={`Show the "${taxLabelText}" rate column in the PDF`}
                          />
                        ) : null
                      }
                    />
                    <TaxRateInput
                      control={control}
                      index={index}
                      taxLabelText={taxLabelText}
                      hasError={!!itemErrors?.vat}
                    />
                  </div>
                  <TaxRateChips
                    control={control}
                    index={index}
                    setValue={setValue}
                    hasError={!!itemErrors?.vat}
                  />
                  {itemErrors?.vat ? (
                    <ErrorMessage>{itemErrors.vat.message}</ErrorMessage>
                  ) : null}
                </div>

                {isFirstItem && !itemErrors?.vat && !errors.taxLabelText ? (
                  <InputHelperMessage>
                    The label is shared by every item, the amount columns and
                    the summary table. The rate takes 0–100 or text such as NP.
                  </InputHelperMessage>
                ) : null}
              </div>

              {/* optional extras: pills that share a row while closed, cards once open */}
              <div className="flex flex-wrap gap-2">
                <ItemDiscountFields
                  control={control}
                  index={index}
                  errors={errors}
                  currency={currency}
                  getValues={getValues}
                  setValue={setValue}
                />
                <ItemCustomColumnField
                  control={control}
                  index={index}
                  errors={errors}
                  getValues={getValues}
                  setValue={setValue}
                />
              </div>

              <ItemAmountsCard
                control={control}
                index={index}
                currency={currency}
                template={template}
                numberFormatLocale={numberFormatLocale}
                taxLabelText={taxLabelText}
                showColumnSwitches={showDefaultTemplateColumnSwitches}
                hiddenColumns={hiddenAmountColumns}
              />
            </div>
          </fieldset>
        );
      })}

      <CustomTooltip
        trigger={
          <Button
            ref={addItemButtonRef}
            onClick={() => {
              append(NEW_INVOICE_ITEM);

              trackEvent({ event: "add_invoice_item" });
            }}
            variant="default"
            disabled={hasReachedItemLimit}
            className="w-full gap-2"
          >
            <Plus className="size-4" />
            Add invoice item
          </Button>
        }
        content={
          hasReachedItemLimit
            ? `Invoices support at most ${MAX_INVOICE_ITEMS} line items`
            : "Add a new line item with name, quantity, price and tax details"
        }
        side="bottom"
        showArrow
      />

      {/* the Stripe template prints neither a number column nor a summary table */}
      {isDefaultTemplate ? (
        <PdfOptionsCard control={control} taxLabelText={taxLabelText} />
      ) : null}

      <DeleteInvoiceItemDialog
        itemPendingDeletion={itemPendingDeletion}
        onClose={() => {
          return setItemPendingDeletion(null);
        }}
        onConfirm={handleRemoveInvoiceItem}
        addItemButtonRef={addItemButtonRef}
        deleteTriggerRef={deleteTriggerRef}
      />
    </>
  );
});

/** A field's label, with its "In PDF" switch on the right when it has one. */
function FieldHeader({ htmlFor, label, columnSwitch }: FieldHeaderProps) {
  return (
    <div className="mb-1.5 flex min-h-5 items-center justify-between gap-2">
      {/* a header that runs out of room truncates rather than wrapping under its
          switch and pushing the input out of line with its neighbour */}
      <Label htmlFor={htmlFor} className="min-w-0 truncate">
        {label}
      </Label>
      {columnSwitch}
    </div>
  );
}

/**
 * The quantity, with − and + joined to either end. Standard buttons and a standard
 * input rather than one clipped box, so the buttons press like every other button and
 * the field focuses like every other field. They step by one and keep any fraction the user typed (1.5 becomes 2.5), never
 * going below zero.
 */
function QuantityStepper({ control, index, hasError }: QuantityStepperProps) {
  return (
    <Controller
      name={`items.${index}.amount`}
      control={control}
      render={({ field }) => {
        // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `<Input type="number">` gives back a string at runtime, the schema type says number
        const quantity = Number(field.value) || 0;

        const stepBy = (delta: number) => {
          // rounded so 0.1 + 1 stays 1.1 rather than picking up float noise
          field.onChange(
            Math.max(0, Math.round((quantity + delta) * 1000) / 1000),
          );
        };

        return (
          // one joined control: the buttons overlap the field's border by 1px, so no
          // double lines, and whichever piece has focus rises above its neighbours
          <div className="flex">
            <Button
              variant="outline"
              size="icon"
              aria-label={`Decrease quantity of item ${index + 1}`}
              disabled={quantity <= 0}
              onClick={() => {
                stepBy(-1);
              }}
              className={cn(STEP_BUTTON_CLASS_NAME, "rounded-e-none")}
            >
              <Minus className="size-4" />
            </Button>
            <Input
              {...field}
              id={`itemAmount${index}`}
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              className={cn(
                "relative -mx-px h-9 rounded-none text-center tabular-nums [appearance:textfield] focus-visible:z-10 max-md:text-base [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                inputErrorClassName(hasError),
              )}
            />
            <Button
              variant="outline"
              size="icon"
              aria-label={`Increase quantity of item ${index + 1}`}
              onClick={() => {
                stepBy(1);
              }}
              className={cn(STEP_BUTTON_CLASS_NAME, "rounded-s-none")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        );
      }}
    />
  );
}

/** One-tap units under the unit field; picking one fills it in. */
function UnitChips({ control, index, setValue, hasError }: UnitChipsProps) {
  const unit = useWatch({ control, name: `items.${index}.unit` });

  return (
    <div
      role="group"
      aria-label={`Common units for item ${index + 1}`}
      className="flex flex-wrap items-center gap-1.5"
    >
      {COMMON_UNITS.map((commonUnit) => {
        const isSelected = unit === commonUnit;

        return (
          <button
            key={commonUnit}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              setValue(`items.${index}.unit`, commonUnit, {
                shouldDirty: true,
                // validate only to clear an error the old value left behind
                shouldValidate: hasError,
              });
            }}
            className={cn(
              "h-[26px] rounded-full border px-2.5 text-xs transition-[border-color,transform] duration-150 ease-out active:scale-[0.97] max-md:h-9 max-md:px-2.5 max-md:text-sm",
              isSelected
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-slate-700 [@media(hover:hover)_and_(pointer:fine)]:hover:border-slate-400",
            )}
          >
            {commonUnit}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The item's tax rate. It also takes text (NP, OO), so the % suffix shows only while the
 * value reads as a number.
 */
function TaxRateInput({
  control,
  index,
  taxLabelText,
  hasError,
}: TaxRateInputProps) {
  return (
    <Controller
      name={`items.${index}.vat`}
      control={control}
      render={({ field }) => {
        const value = String(field.value ?? "").trim();

        const isNumeric = value !== "" && !Number.isNaN(Number(value));

        return (
          <div className="relative">
            <Input
              {...field}
              id={`itemVat${index}`}
              // names the tax even where the visible label just says "Rate"
              aria-label={`${taxLabelText} rate`}
              type="text"
              inputMode="decimal"
              placeholder="e.g. 23 or NP"
              className={cn(
                "h-9 tabular-nums max-md:text-base",
                isNumeric && "pe-8",
                inputErrorClassName(hasError),
              )}
            />
            {isNumeric ? (
              <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-sm text-slate-500">
                %
              </span>
            ) : null}
          </div>
        );
      }}
    />
  );
}

/**
 * One-tap common rates under the rate field. Typing still takes any value, and a chip
 * shows as picked whenever the field holds its value, typed or tapped.
 */
function TaxRateChips({
  control,
  index,
  setValue,
  hasError,
}: TaxRateChipsProps) {
  const rate = useWatch({ control, name: `items.${index}.vat` });

  const current = String(rate ?? "")
    .trim()
    .toUpperCase();

  return (
    <div
      role="group"
      aria-label={`Common rates for item ${index + 1}`}
      className="flex flex-wrap items-center gap-1.5"
    >
      {COMMON_TAX_RATES.map((commonRate) => {
        const isSelected =
          typeof commonRate.value === "number"
            ? current !== "" && Number(current) === commonRate.value
            : current === commonRate.value;

        return (
          <button
            key={commonRate.label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              setValue(`items.${index}.vat`, commonRate.value, {
                shouldDirty: true,
                // validate only to clear an error the old value left behind
                shouldValidate: hasError,
              });
            }}
            className={cn(
              "h-[26px] rounded-full border px-2.5 text-xs tabular-nums transition-[border-color,transform] duration-150 ease-out active:scale-[0.97] max-md:h-9 max-md:px-2.5 max-md:text-sm",
              isSelected
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-slate-700 [@media(hover:hover)_and_(pointer:fine)]:hover:border-slate-400",
            )}
          >
            {commonRate.label}
          </button>
        );
      })}
    </div>
  );
}

/** The invoice-wide switches for the items table, grouped under "Show in PDF". */
function PdfOptionsCard({ control, taxLabelText }: PdfOptionsCardProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="mt-4 flex flex-col rounded-lg border px-4 pb-1 pt-3"
    >
      <h3
        id={headingId}
        className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500"
      >
        Show in PDF
      </h3>
      <PdfOptionRow
        control={control}
        name="items.0.invoiceItemNumberIsVisible"
        label="Number column"
        description="Numbers each item 1, 2, 3…"
      />
      <PdfOptionRow
        control={control}
        name="vatTableSummaryIsVisible"
        label={`${taxLabelText} summary table`}
        description={`Net, ${taxLabelText} and total per rate, under the items`}
        isLast
      />
    </section>
  );
}

/** A whole-row switch: on a phone the row is the tap target, not just the small track. */
function PdfOptionRow({
  control,
  name,
  label,
  description,
  isLast = false,
}: PdfOptionRowProps) {
  const id = useId();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-2 max-md:min-h-[60px]",
        !isLast && "border-b border-slate-100",
      )}
    >
      <Label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        <span className="text-xs font-normal text-slate-500">
          {description}
        </span>
      </Label>
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
            />
          );
        }}
      />
    </div>
  );
}

/** The − and + at either end of the quantity: as tall as the field, bordered like it. */
const STEP_BUTTON_CLASS_NAME =
  "relative size-9 shrink-0 border-gray-300 bg-slate-50 text-slate-700 shadow-sm shadow-black/5 hover:bg-slate-100 focus-visible:z-10";

const COMMON_TAX_RATES = [
  { label: "NP", value: "NP" },
  { label: "0%", value: 0 },
  { label: "5%", value: 5 },
  { label: "8%", value: 8 },
  { label: "23%", value: 23 },
] as const satisfies ReadonlyArray<{
  label: string;
  value: InvoiceItemData["vat"];
}>;

const COMMON_UNITS = ["service", "hours", "days", "pcs"] as const;

const NEW_INVOICE_ITEM = {
  invoiceItemNumberIsVisible: true,
  name: "",
  nameFieldIsVisible: true,
  amount: 1,
  amountFieldIsVisible: true,
  unit: "",
  unitFieldIsVisible: true,
  netPrice: 0,
  netPriceFieldIsVisible: true,
  vat: "NP",
  vatFieldIsVisible: true,
  netAmount: 0,
  netAmountFieldIsVisible: true,
  vatAmount: 0,
  vatAmountFieldIsVisible: true,
  preTaxAmount: 0,
  preTaxAmountFieldIsVisible: true,
  discountType: "percentage",
  discountValue: 0,
  discountLabel: "",
  discountAmount: 0,
  typeOfGTU: "",
  typeOfGTUFieldIsVisible: true,
} as const satisfies InvoiceItemData;

/**
 * The unit price as the PDF writes it, and in words, under the field (as on `main`): a
 * number input shows long prices ungrouped, so this is where they're easy to check.
 */
function UnitPricePreview({
  value,
  currency,
  numberFormatLocale,
  template,
  language,
}: UnitPricePreviewProps) {
  // a number input gives back a string while typing
  const amount = Number(value) || 0;

  return (
    <InputHelperMessage>
      Preview:{" "}
      {formatMoneyForTemplate({
        amount,
        currency,
        numberFormatLocale,
        template,
      })}{" "}
      ({getAmountInWords({ amount, language })} {currency}{" "}
      {getNumberFractionalPart(amount)}/100)
    </InputHelperMessage>
  );
}

/** Space kept above an item card scrolled to the top, for the legend on its border. */
const ITEM_CARD_SCROLL_GAP = 12;

/**
 * Scrolls an item card to just below the top of whatever scrolls it: the form's own box
 * on phones, its column on desktop. Only that box moves, so the page header and the phone
 * dock stay where they are.
 */
function scrollItemCardIntoView(index: number) {
  const card = document.querySelector<HTMLElement>(
    `[data-item-card="${index}"]`,
  );

  if (!card) return;

  const scroller = getScrollParent(card);
  const isPage = scroller === document.scrollingElement;
  const scrollerTop = isPage ? 0 : scroller.getBoundingClientRect().top;
  const top =
    card.getBoundingClientRect().top -
    scrollerTop +
    scroller.scrollTop -
    ITEM_CARD_SCROLL_GAP;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  scroller.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

/** The nearest ancestor that scrolls vertically, or the page. */
function getScrollParent(element: HTMLElement): Element {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);

    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
  }

  return document.scrollingElement ?? document.documentElement;
}

interface InvoiceItemsSettingsProps {
  control: Control<InvoiceData>;
  fields: FieldArrayWithId<InvoiceData, "items">[];
  handleRemoveInvoiceItem: (index: number) => void;
  append: UseFieldArrayAppend<InvoiceData, "items">;
  /** Places a copy right after the item it was made from, for Duplicate. */
  insert: UseFieldArrayInsert<InvoiceData, "items">;
  errors: FieldErrors<InvoiceData>;
  currency: SupportedCurrencies;
  template: InvoiceData["template"];
  taxLabelText: string;
  /** The invoice's number format, already resolved against its language. */
  numberFormatLocale: SupportedNumberFormatLocale;
  /** The PDF's language, for the unit price written out in words. */
  language: SupportedLanguages;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
}

interface UnitPricePreviewProps {
  /** The field's value: a number, or the string a number input gives back. */
  value: unknown;
  currency: SupportedCurrencies;
  numberFormatLocale: SupportedNumberFormatLocale;
  template: InvoiceData["template"];
  language: SupportedLanguages;
}

interface FieldHeaderProps {
  htmlFor: string;
  label: string;
  /** The field's "In PDF" switch, on the first item only. */
  columnSwitch?: React.ReactNode;
}

interface QuantityStepperProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  hasError: boolean;
}

interface UnitChipsProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  setValue: UseFormSetValue<InvoiceData>;
  /** The unit field shows an error, which picking a chip should clear. */
  hasError: boolean;
}

interface TaxRateInputProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  /** The invoice's tax name, for the field's accessible name ("VAT rate"). */
  taxLabelText: string;
  hasError: boolean;
}

interface TaxRateChipsProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  setValue: UseFormSetValue<InvoiceData>;
  /** The rate field shows an error, which picking a chip should clear. */
  hasError: boolean;
}

interface PdfOptionsCardProps {
  control: Control<InvoiceData>;
  taxLabelText: string;
}

interface PdfOptionRowProps {
  control: Control<InvoiceData>;
  name: "items.0.invoiceItemNumberIsVisible" | "vatTableSummaryIsVisible";
  label: string;
  description: string;
  /** Drops the divider under the last row. */
  isLast?: boolean;
}
