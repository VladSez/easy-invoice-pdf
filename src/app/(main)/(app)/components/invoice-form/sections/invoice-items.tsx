import {
  formatAmount,
  formatMoneyForTemplate,
  getAmountInWords,
  getNumberFractionalPart,
  INVOICE_PDF_TRANSLATIONS,
  type InvoiceData,
  MAX_INVOICE_ITEMS,
  type SupportedCurrencies,
  type SupportedLanguages,
  type SupportedNumberFormatLocale,
} from "@easyinvoicepdf/invoice-core";
import { Plus } from "lucide-react";
import { memo, useRef, useState } from "react";
import {
  type Control,
  Controller,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form";

import { inputErrorClassName } from "@/app/(main)/(app)/components/invoice-form/common";
import { DeleteIconButton } from "@/app/(main)/(app)/components/invoice-form/sections/components/delete-icon-button";
import {
  DeleteInvoiceItemDialog,
  type ItemPendingDeletion,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/delete-invoice-item-dialog";
import { ItemDiscountFields } from "@/app/(main)/(app)/components/invoice-form/sections/components/item-discount-fields";
import { Legend } from "@/components/legend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { MoneyInput, ReadOnlyMoneyInput } from "@/components/ui/money-input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

interface InvoiceItemsSettingsProps {
  control: Control<InvoiceData>;
  fields: FieldArrayWithId<InvoiceData, "items">[];
  handleRemoveInvoiceItem: (index: number) => void;
  append: UseFieldArrayAppend<InvoiceData, "items">;
  errors: FieldErrors<InvoiceData>;
  currency: SupportedCurrencies;
  language: SupportedLanguages;
  template: InvoiceData["template"];
  taxLabelText: string;
  /** The invoice's number format, already resolved against its language. */
  numberFormatLocale: SupportedNumberFormatLocale;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
}

export const InvoiceItems = memo(function InvoiceItems({
  control,
  fields,
  handleRemoveInvoiceItem,
  errors,
  currency,
  language,
  append,
  template,
  taxLabelText,
  numberFormatLocale,
  getValues,
  setValue,
}: InvoiceItemsSettingsProps) {
  const [itemPendingDeletion, setItemPendingDeletion] =
    useState<ItemPendingDeletion | null>(null);
  const addItemButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const hasReachedItemLimit = fields.length >= MAX_INVOICE_ITEMS;

  return (
    <>
      {fields.map((field, index) => {
        const isNotFirstItem = index > 0;
        const isFirstItem = index === 0;

        return (
          <fieldset
            key={field.id}
            className="relative mb-4 rounded-lg border p-4 shadow"
          >
            {/* Delete invoice item button */}
            {isNotFirstItem ? (
              <div className="absolute -right-3 -top-10">
                <DeleteIconButton
                  label={`Delete Invoice Item ${index + 1}`}
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
                />
              </div>
            ) : null}
            <Legend>Item {index + 1}</Legend>
            <div className="relative mb-8 space-y-4">
              <div>
                {/* Invoice Item Name */}
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor={`itemName${index}`} className="">
                    Name
                  </Label>

                  {/* Show Name field in PDF switch (Only show for default template) */}
                  {isFirstItem && template === "default" ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.nameFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <Switch
                              {...field}
                              id={`itemNameFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              size="sm"
                              aria-label={`Show the 'Name of Goods/Service' Column in the PDF for item ${index + 1}`}
                            />
                          );
                        }}
                      />
                      <CustomTooltip
                        trigger={
                          <Label htmlFor={`itemNameFieldIsVisible${index}`}>
                            Show in PDF
                          </Label>
                        }
                        content="Show the 'Name of Goods/Service' Column in the PDF"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Name input */}
                <Controller
                  name={`items.${index}.name`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <Textarea
                        {...field}
                        rows={4}
                        id={`itemName${index}`}
                        className={inputErrorClassName(
                          !!errors.items?.[index]?.name,
                        )}
                      />
                    );
                  }}
                />
                {errors.items?.[index]?.name ? (
                  <ErrorMessage>
                    {errors.items[index]?.name?.message}
                  </ErrorMessage>
                ) : null}
              </div>

              {/* Invoice Item Type of GTU - Only show for default template */}
              {template === "default" ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label htmlFor={`itemTypeOfGTU${index}`} className="">
                      Type of GTU
                    </Label>

                    {/* Show Type of GTU field in PDF switch */}
                    {isFirstItem ? (
                      <div className="inline-flex items-center gap-2">
                        <Controller
                          name={`items.${index}.typeOfGTUFieldIsVisible`}
                          control={control}
                          render={({
                            field: { value, onChange, ...field },
                          }) => {
                            return (
                              <Switch
                                {...field}
                                id={`itemTypeOfGTUFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                size="sm"
                                aria-label={`Show the 'Type of GTU' Column in the PDF for item ${index + 1}`}
                              />
                            );
                          }}
                        />
                        <CustomTooltip
                          trigger={
                            <Label
                              htmlFor={`itemTypeOfGTUFieldIsVisible${index}`}
                            >
                              Show in PDF
                            </Label>
                          }
                          content='Show the "Type of GTU" Column in the PDF'
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Type of GTU input */}
                  <Controller
                    name={`items.${index}.typeOfGTU`}
                    control={control}
                    render={({ field }) => {
                      return (
                        <Input
                          {...field}
                          id={`itemTypeOfGTU${index}`}
                          className={inputErrorClassName(
                            !!errors.items?.[index]?.typeOfGTU,
                          )}
                          type="text"
                        />
                      );
                    }}
                  />
                  {errors.items?.[index]?.typeOfGTU ? (
                    <ErrorMessage>
                      {errors.items[index]?.typeOfGTU?.message}
                    </ErrorMessage>
                  ) : null}
                </div>
              ) : null}

              {/* Invoice Item Amount */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor={`itemAmount${index}`} className="">
                    Amount (Quantity)
                  </Label>

                  {/* Show Amount field in PDF switch (Only show for default template) */}
                  {isFirstItem && template === "default" ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.amountFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <Switch
                              {...field}
                              id={`itemAmountFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              size="sm"
                              aria-label={`Show the 'Amount' Column in the PDF for item ${index + 1}`}
                            />
                          );
                        }}
                      />
                      <CustomTooltip
                        trigger={
                          <Label htmlFor={`itemAmountFieldIsVisible${index}`}>
                            Show in PDF
                          </Label>
                        }
                        content='Show the "Amount" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* Amount input */}
                <Controller
                  name={`items.${index}.amount`}
                  control={control}
                  render={({ field }) => {
                    // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `<Input type="number">` gives back a string at runtime, the schema type says number
                    const fieldValueNumber = Number(field.value) || 0;
                    const previewFormattedValue = formatAmount({
                      amount: fieldValueNumber,
                      numberFormatLocale,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 3,
                    });

                    return (
                      <>
                        <Input
                          {...field}
                          id={`itemAmount${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          className={inputErrorClassName(
                            !!errors.items?.[index]?.amount,
                          )}
                        />
                        {!errors.items?.[index]?.amount ? (
                          <InputHelperMessage>
                            Preview: {previewFormattedValue}
                          </InputHelperMessage>
                        ) : null}
                      </>
                    );
                  }}
                />
                {errors.items?.[index]?.amount ? (
                  <ErrorMessage>
                    {errors.items[index].amount.message}
                  </ErrorMessage>
                ) : null}
              </div>

              {/* Invoice Item Unit */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor={`itemUnit${index}`} className="">
                    Unit
                  </Label>

                  {/* Show Unit field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.unitFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <Switch
                              {...field}
                              id={`itemUnitFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              size="sm"
                              aria-label={`Show the 'Unit' Column in the PDF for item ${index + 1}`}
                            />
                          );
                        }}
                      />
                      <CustomTooltip
                        trigger={
                          <Label htmlFor={`itemUnitFieldIsVisible${index}`}>
                            Show in PDF
                          </Label>
                        }
                        content='Show the "Unit" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* Unit input */}
                <Controller
                  name={`items.${index}.unit`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <Input
                        {...field}
                        id={`itemUnit${index}`}
                        type="text"
                        className={inputErrorClassName(
                          !!errors.items?.[index]?.unit,
                        )}
                      />
                    );
                  }}
                />
                {errors.items?.[index]?.unit ? (
                  <ErrorMessage>
                    {errors.items[index].unit.message}
                  </ErrorMessage>
                ) : null}
              </div>

              {/* Invoice Item Net Price */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor={`itemNetPrice${index}`} className="">
                    Net Price (Rate or Unit Price)
                  </Label>

                  {/* Show Net Price field in PDF switch (Only show for default template) */}
                  {isFirstItem && template === "default" ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.netPriceFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <Switch
                              {...field}
                              id={`itemNetPriceFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              size="sm"
                              aria-label={`Show the 'Net Price' Column in the PDF for item ${index + 1}`}
                            />
                          );
                        }}
                      />
                      <CustomTooltip
                        trigger={
                          <Label htmlFor={`itemNetPriceFieldIsVisible${index}`}>
                            Show in PDF
                          </Label>
                        }
                        content='Show the "Net Price" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* Net price input */}
                <div className="flex items-center gap-2">
                  <Controller
                    name={`items.${index}.netPrice`}
                    control={control}
                    render={({ field }) => {
                      // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `<Input type="number">` gives back a string at runtime, the schema type says number
                      const fieldValueNumber = Number(field.value) || 0;

                      // written in the invoice's number format and the way its template
                      // shows the currency, so the preview matches the PDF
                      const previewFormattedValue = formatMoneyForTemplate({
                        amount: fieldValueNumber,
                        currency,
                        numberFormatLocale,
                        template,
                      });

                      const previewAmountInWords = getAmountInWords({
                        amount: fieldValueNumber,
                        language,
                      });

                      const previewNumberFractionalPart =
                        getNumberFractionalPart(fieldValueNumber);

                      return (
                        <div className="flex w-full flex-col">
                          <MoneyInput
                            {...field}
                            id={`itemNetPrice${index}`}
                            currency={currency}
                            type="number"
                            step="0.01"
                            min="0"
                            className={cn(
                              "w-full",
                              inputErrorClassName(
                                !!errors.items?.[index]?.netPrice,
                              ),
                            )}
                            dataTestId={`itemNetPrice${index}`}
                          />
                          {!errors.items?.[index]?.netPrice ? (
                            <InputHelperMessage>
                              Preview: {previewFormattedValue} (
                              {previewAmountInWords} {currency}{" "}
                              {previewNumberFractionalPart}/100)
                            </InputHelperMessage>
                          ) : null}
                        </div>
                      );
                    }}
                  />
                </div>

                {errors.items?.[index]?.netPrice ? (
                  <ErrorMessage>
                    {errors.items[index].netPrice.message}
                  </ErrorMessage>
                ) : null}
              </div>

              {/* Invoice Item Discount */}
              <ItemDiscountFields
                control={control}
                index={index}
                errors={errors}
                currency={currency}
                template={template}
                numberFormatLocale={numberFormatLocale}
                getValues={getValues}
                setValue={setValue}
              />

              {/* Invoice Item Tax Settings */}
              <fieldset className="rounded-md border px-4 pb-4">
                <legend className="text-base font-semibold lg:text-lg">
                  Tax Settings
                </legend>
                <div className="mb-2 flex items-center justify-end">
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.vatFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <Switch
                              {...field}
                              id={`itemVatFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              size="sm"
                              aria-label={`Show the '${taxLabelText}' Column in the PDF for item ${index + 1}`}
                            />
                          );
                        }}
                      />
                      <CustomTooltip
                        trigger={
                          <Label htmlFor={`itemVatFieldIsVisible${index}`}>
                            Show in PDF
                          </Label>
                        }
                        content={`Show the "${taxLabelText}" Column in the PDF`}
                      />
                    </div>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="taxLabelText">Tax Label</Label>
                  <Controller
                    name="taxLabelText"
                    control={control}
                    render={({ field }) => {
                      return (
                        <Input
                          {...field}
                          type="text"
                          id="taxLabelText"
                          placeholder="Enter tax label (e.g., VAT, Tax, GST, Sales Tax)"
                          className={cn(
                            "mt-1 block w-full",
                            inputErrorClassName(!!errors.taxLabelText),
                          )}
                        />
                      );
                    }}
                  />
                  {errors.taxLabelText ? (
                    <ErrorMessage>{errors.taxLabelText.message}</ErrorMessage>
                  ) : null}
                  {!errors.taxLabelText ? (
                    <InputHelperMessage>
                      Customize the tax label on your invoice (e.g., VAT, Sales
                      Tax, IVA). Default:{" "}
                      {INVOICE_PDF_TRANSLATIONS[language].invoiceItemsTable.vat}
                    </InputHelperMessage>
                  ) : null}
                </div>
                <div data-testid={`itemVat${index}`} className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Label htmlFor={`itemVat${index}`} className="">
                      {taxLabelText} Rate
                    </Label>
                  </div>

                  {/* Tax input */}
                  <Controller
                    name={`items.${index}.vat`}
                    control={control}
                    render={({ field }) => {
                      return (
                        <Input
                          {...field}
                          id={`itemVat${index}`}
                          type="text"
                          className={inputErrorClassName(
                            !!errors.items?.[index]?.vat,
                          )}
                        />
                      );
                    }}
                  />

                  {errors.items?.[index]?.vat ? (
                    <ErrorMessage>
                      {errors.items[index].vat.message}
                    </ErrorMessage>
                  ) : (
                    <InputHelperMessage>
                      Enter a number (0-100) or text (e.g., NP, OO, etc).
                    </InputHelperMessage>
                  )}
                </div>
              </fieldset>

              {/* Invoice Item Net Amount */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor={`itemNetAmount${index}`} className="">
                    Net Amount
                  </Label>

                  {/* Show Net Amount field in PDF switch (Only show for default template) */}
                  {isFirstItem && template === "default" ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.netAmountFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <Switch
                              {...field}
                              id={`itemNetAmountFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              size="sm"
                              aria-label={`Show the 'Net Amount' Column in the PDF for item ${index + 1}`}
                            />
                          );
                        }}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`itemNetAmountFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show the "Net Amount" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* Invoice Item Net Amount (calculated automatically - read only) */}
                <Controller
                  name={`items.${index}.netAmount`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <ReadOnlyMoneyInput
                        {...field}
                        id={`itemNetAmount${index}`}
                        currency={currency}
                        value={formatAmount({
                          amount: field.value,
                          numberFormatLocale,
                        })}
                        className={inputErrorClassName(
                          !!errors.items?.[index]?.netAmount,
                        )}
                        dataTestId={`itemNetAmount${index}`}
                      />
                    );
                  }}
                />

                {errors.items?.[index]?.netAmount ? (
                  <ErrorMessage>
                    {errors.items[index].netAmount.message}
                  </ErrorMessage>
                ) : (
                  <InputHelperMessage>
                    Calculated automatically based on Amount, Net Price and
                    Discount
                  </InputHelperMessage>
                )}
              </div>

              {/* Invoice Item Tax Amount (calculated automatically - read only) */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor={`itemVatAmount${index}`} className="">
                    {taxLabelText} Amount
                  </Label>

                  {/* Show Tax Amount field in PDF switch (Only show for default template) */}
                  {isFirstItem && template === "default" ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.vatAmountFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <Switch
                              {...field}
                              id={`itemVatAmountFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              size="sm"
                              aria-label={`Show the '${taxLabelText} Amount' Column in the PDF for item ${index + 1}`}
                            />
                          );
                        }}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`itemVatAmountFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content={`Show the "${taxLabelText} Amount" Column in the PDF`}
                      />
                    </div>
                  ) : null}
                </div>

                {/* Tax amount input */}
                <Controller
                  name={`items.${index}.vatAmount`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <ReadOnlyMoneyInput
                        {...field}
                        id={`itemVatAmount${index}`}
                        currency={currency}
                        value={formatAmount({
                          amount: field.value,
                          numberFormatLocale,
                        })}
                        className={inputErrorClassName(
                          !!errors.items?.[index]?.vatAmount,
                        )}
                        data-testid="vat-amount"
                      />
                    );
                  }}
                />

                {errors.items?.[index]?.vatAmount ? (
                  <ErrorMessage>
                    {errors.items[index].vatAmount.message}
                  </ErrorMessage>
                ) : (
                  <InputHelperMessage>
                    Calculated automatically based on Net Amount and{" "}
                    {taxLabelText}
                  </InputHelperMessage>
                )}
              </div>

              {/* Pre-tax Amount field (calculated automatically - read only) */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor={`itemPreTaxAmount${index}`} className="">
                    Pre-tax Amount
                  </Label>

                  {/* Show Pre-tax Amount field in PDF switch (Only show for default template) */}
                  {isFirstItem && template === "default" ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.preTaxAmountFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => {
                          return (
                            <Switch
                              {...field}
                              id={`itemPreTaxAmountFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              size="sm"
                              aria-label={`Show the 'Pre-tax Amount' Column in the PDF for item ${index + 1}`}
                            />
                          );
                        }}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`itemPreTaxAmountFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show the "Pre-tax Amount" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* Pre-tax amount input */}
                <Controller
                  name={`items.${index}.preTaxAmount`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <ReadOnlyMoneyInput
                        {...field}
                        id={`itemPreTaxAmount${index}`}
                        currency={currency}
                        value={formatAmount({
                          amount: field.value,
                          numberFormatLocale,
                        })}
                        className={inputErrorClassName(
                          !!errors.items?.[index]?.preTaxAmount,
                        )}
                      />
                    );
                  }}
                />

                {errors.items?.[index]?.preTaxAmount ? (
                  <ErrorMessage>
                    {errors.items[index].preTaxAmount.message}
                  </ErrorMessage>
                ) : (
                  <InputHelperMessage>
                    Calculated automatically based on Net Amount and{" "}
                    {taxLabelText}
                  </InputHelperMessage>
                )}
              </div>
            </div>
          </fieldset>
        );
      })}

      <CustomTooltip
        trigger={
          <Button
            ref={addItemButtonRef}
            onClick={() => {
              append({
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
              });

              umamiTrackEvent("add_invoice_item");
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

      {/** we only want to show "Show Number Column" and "Show Tax Table Summary" settings for default template */}
      {template === "default" ? (
        <div className="mt-6 space-y-4 rounded-md border p-4">
          {/* Show Number column on PDF switch */}
          <div className="relative flex items-center justify-between gap-2">
            <Label
              htmlFor={`itemInvoiceItemNumberIsVisible0`}
              className="text-balance font-medium"
            >
              Show &quot;Number&quot; Column in the Items and pricing table
            </Label>

            <Controller
              name={`items.0.invoiceItemNumberIsVisible`}
              control={control}
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Switch
                    {...field}
                    id={`itemInvoiceItemNumberIsVisible0`}
                    checked={value}
                    onCheckedChange={onChange}
                    size="sm"
                  />
                );
              }}
            />
          </div>

          {/* Show Tax Table Summary in PDF switch */}
          <div className="relative flex items-center justify-between gap-2">
            <Label
              htmlFor={`vatTableSummaryIsVisible`}
              className="text-balance"
            >
              Show &quot;{taxLabelText} Table Summary&quot; in the PDF
            </Label>

            <Controller
              name={`vatTableSummaryIsVisible`}
              control={control}
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Switch
                    {...field}
                    id={`vatTableSummaryIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    size="sm"
                  />
                );
              }}
            />
          </div>
        </div>
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
