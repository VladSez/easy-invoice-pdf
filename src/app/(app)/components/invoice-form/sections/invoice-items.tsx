import {
  type InvoiceData,
  type SupportedCurrencies,
  type SupportedLanguages,
} from "@/app/schema";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { memo, useState } from "react";
import {
  type Control,
  Controller,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFieldArrayAppend,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { MoneyInput, ReadOnlyMoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { Plus, Trash2 } from "lucide-react";
import { Legend } from "@/components/legend";
import {
  getAmountInWords,
  getNumberFractionalPart,
} from "@/utils/invoice.utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

interface InvoiceItemsSettingsProps {
  control: Control<InvoiceData>;
  fields: FieldArrayWithId<InvoiceData, "items", "id">[];
  handleRemoveItem: (index: number) => void;
  append: UseFieldArrayAppend<InvoiceData, "items">;
  errors: FieldErrors<InvoiceData>;
  currency: SupportedCurrencies;
  language: SupportedLanguages;
  template: InvoiceData["template"];
  taxLabelText: string;
  invoiceData: InvoiceData;
}

export const InvoiceItems = memo(function InvoiceItems({
  control,
  fields,
  handleRemoveItem,
  errors,
  currency,
  language,
  append,
  template,
  taxLabelText,
  invoiceData,
}: InvoiceItemsSettingsProps) {
  const [deleteItemIndex, setDeleteItemIndex] = useState<number | null>(null);

  return (
    <>
      {/** we only want to show these settings for default template */}
      {template === "default" && (
        <div className="mb-3 space-y-4">
          {/* Show Number column on PDF switch */}
          <div className="relative flex items-center justify-between">
            <Label htmlFor={`itemInvoiceItemNumberIsVisible0`}>
              Show &quot;Number&quot; Column in the Invoice Items Table
            </Label>

            <Controller
              name={`items.0.invoiceItemNumberIsVisible`}
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Switch
                  {...field}
                  id={`itemInvoiceItemNumberIsVisible0`}
                  checked={value}
                  onCheckedChange={onChange}
                  className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                />
              )}
            />
          </div>

          {/* Show Tax Table Summary in PDF switch */}
          <div className="relative flex items-center justify-between">
            <Label htmlFor={`vatTableSummaryIsVisible`}>
              Show &quot;{taxLabelText} Table Summary&quot; in the PDF
            </Label>

            <Controller
              name={`vatTableSummaryIsVisible`}
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <Switch
                  {...field}
                  id={`vatTableSummaryIsVisible`}
                  checked={value}
                  onCheckedChange={onChange}
                  className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                />
              )}
            />
          </div>
        </div>
      )}
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
                <CustomTooltip
                  trigger={
                    <button
                      type="button"
                      onClick={() => setDeleteItemIndex(index)}
                      className="flex items-center justify-center rounded-full bg-red-600 p-2 transition-colors hover:bg-red-700 active:scale-[98%] active:transition-transform"
                    >
                      <span className="sr-only">
                        Delete Invoice Item {index + 1}
                      </span>
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  }
                  content={`Delete Invoice Item ${index + 1}`}
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
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`itemNameFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label={`Show the 'Name of Goods/Service' Column in the PDF for item ${index + 1}`}
                          />
                        )}
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
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      rows={4}
                      id={`itemName${index}`}
                      className=""
                    />
                  )}
                />
                {errors.items?.[index]?.name && (
                  <ErrorMessage>
                    {errors.items[index]?.name?.message}
                  </ErrorMessage>
                )}
              </div>

              {/* Invoice Item Type of GTU - Only show for default template */}
              {template === "default" && (
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
                          }) => (
                            <Switch
                              {...field}
                              id={`itemTypeOfGTUFieldIsVisible${index}`}
                              checked={value}
                              onCheckedChange={onChange}
                              className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              aria-label={`Show the 'Type of GTU' Column in the PDF for item ${index + 1}`}
                            />
                          )}
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
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`itemTypeOfGTU${index}`}
                        className=""
                        type="text"
                      />
                    )}
                  />
                  {errors.items?.[index]?.typeOfGTU && (
                    <ErrorMessage>
                      {errors.items[index]?.typeOfGTU?.message}
                    </ErrorMessage>
                  )}
                </div>
              )}

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
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`itemAmountFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label={`Show the 'Amount' Column in the PDF for item ${index + 1}`}
                          />
                        )}
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
                    const fieldValueNumber = Number(field.value) || 0;
                    const previewFormattedValue =
                      fieldValueNumber.toLocaleString("en-US", {
                        style: "decimal",
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
                          className=""
                        />
                        {!errors.items?.[index]?.amount && (
                          <InputHelperMessage>
                            Preview: {previewFormattedValue}
                          </InputHelperMessage>
                        )}
                      </>
                    );
                  }}
                />
                {errors.items?.[index]?.amount && (
                  <ErrorMessage>
                    {errors.items[index].amount.message}
                  </ErrorMessage>
                )}
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
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`itemUnitFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label={`Show the 'Unit' Column in the PDF for item ${index + 1}`}
                          />
                        )}
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
                  render={({ field }) => (
                    <Input {...field} id={`itemUnit${index}`} type="text" />
                  )}
                />
                {errors.items?.[index]?.unit && (
                  <ErrorMessage>
                    {errors.items[index].unit.message}
                  </ErrorMessage>
                )}
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
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`itemNetPriceFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label={`Show the 'Net Price' Column in the PDF for item ${index + 1}`}
                          />
                        )}
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
                      const fieldValueNumber = Number(field.value) || 0;

                      const previewFormattedValue =
                        fieldValueNumber.toLocaleString("en-US", {
                          style: "currency",
                          currency: currency,
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
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
                            className="w-full"
                            dataTestId={`itemNetPrice${index}`}
                          />
                          {!errors.items?.[index]?.netPrice && (
                            <InputHelperMessage>
                              Preview: {previewFormattedValue} (
                              {previewAmountInWords} {currency}{" "}
                              {previewNumberFractionalPart}/100)
                            </InputHelperMessage>
                          )}
                        </div>
                      );
                    }}
                  />
                </div>

                {errors.items?.[index]?.netPrice && (
                  <ErrorMessage>
                    {errors.items[index].netPrice.message}
                  </ErrorMessage>
                )}
              </div>

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
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`itemVatFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label={`Show the '${taxLabelText}' Column in the PDF for item ${index + 1}`}
                          />
                        )}
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
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        id="taxLabelText"
                        placeholder="Enter tax label (e.g., VAT, Tax, GST, Sales Tax)"
                        className="mt-1 block w-full"
                      />
                    )}
                  />
                  {errors.taxLabelText && (
                    <ErrorMessage>{errors.taxLabelText.message}</ErrorMessage>
                  )}
                  {!errors.taxLabelText && (
                    <InputHelperMessage>
                      Customize the tax label on your invoice (e.g., VAT, Sales
                      Tax, IVA). Default:{" "}
                      {INVOICE_PDF_TRANSLATIONS[language].invoiceItemsTable.vat}
                    </InputHelperMessage>
                  )}
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
                    render={({ field }) => (
                      <Input
                        {...field}
                        id={`itemVat${index}`}
                        type="text"
                        className=""
                      />
                    )}
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
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`itemNetAmountFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label={`Show the 'Net Amount' Column in the PDF for item ${index + 1}`}
                          />
                        )}
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

                {/* Invoice Item Net Amount (calculated automatically) */}
                <Controller
                  name={`items.${index}.netAmount`}
                  control={control}
                  render={({ field }) => {
                    return (
                      <ReadOnlyMoneyInput
                        {...field}
                        id={`itemNetAmount${index}`}
                        currency={currency}
                        value={field.value.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
                    Calculated automatically based on Amount and Net Price
                  </InputHelperMessage>
                )}
              </div>

              {/* Invoice Item Tax Amount (calculated automatically) */}
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
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`itemVatAmountFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label={`Show the '${taxLabelText} Amount' Column in the PDF for item ${index + 1}`}
                          />
                        )}
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
                        value={field.value.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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

              {/* Pre-tax Amount field */}
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
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`itemPreTaxAmountFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label={`Show the 'Pre-tax Amount' Column in the PDF for item ${index + 1}`}
                          />
                        )}
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
                        value={field.value.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
      <Button
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
            typeOfGTU: "",
            typeOfGTUFieldIsVisible: true,
          });

          // analytics track event
          umamiTrackEvent("add_invoice_item");
        }}
        variant="outline"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add invoice item
      </Button>

      <DeleteInvoiceItemConfirmationDialog
        deleteItemIndex={deleteItemIndex}
        setDeleteItemIndex={setDeleteItemIndex}
        handleRemoveItem={handleRemoveItem}
        invoiceData={invoiceData}
      />
    </>
  );
});

interface DeleteInvoiceItemConfirmationDialogProps {
  deleteItemIndex: number | null;
  setDeleteItemIndex: (index: number | null) => void;
  handleRemoveItem: (index: number) => void;
  invoiceData: InvoiceData;
}

/**
 * A confirmation dialog for deleting an invoice item.
 */
function DeleteInvoiceItemConfirmationDialog({
  deleteItemIndex = 0,
  setDeleteItemIndex,
  handleRemoveItem,
  invoiceData,
}: DeleteInvoiceItemConfirmationDialogProps) {
  const itemNumber = deleteItemIndex ?? 0;

  const itemName =
    invoiceData?.items?.[itemNumber]?.name || `#${itemNumber + 1}`;

  return (
    <AlertDialog
      open={deleteItemIndex !== null}
      onOpenChange={(open) => {
        if (!open) setDeleteItemIndex(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the invoice item{" "}
            <strong>&quot;{itemName}&quot;</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (deleteItemIndex !== null) {
                handleRemoveItem(deleteItemIndex);
                setDeleteItemIndex(null);
              }
            }}
            className="bg-red-500 text-red-50 hover:bg-red-500/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
