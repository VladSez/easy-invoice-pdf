import {
  InvoiceData,
  type SupportedCurrencies,
  type SupportedLanguages,
} from "@/app/schema";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { memo } from "react";
import {
  Control,
  Controller,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFieldArrayAppend,
} from "react-hook-form";
import type { FormPrefixId } from "../..";

import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { MoneyInput, ReadOnlyMoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { getAmountInWords, getNumberFractionalPart } from "@/lib/utils";
import { useOpenPanel } from "@openpanel/nextjs";
import { Plus, Trash2 } from "lucide-react";

const Legend = ({ children }: { children: React.ReactNode }) => {
  return (
    <legend className="text-lg font-semibold text-gray-900">{children}</legend>
  );
};

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

interface InvoiceItemsSettingsProps {
  control: Control<InvoiceData>;
  formPrefixId: FormPrefixId;
  fields: FieldArrayWithId<InvoiceData, "items", "id">[];
  handleRemoveItem: (index: number) => void;
  append: UseFieldArrayAppend<InvoiceData, "items">;
  errors: FieldErrors<InvoiceData>;
  currency: SupportedCurrencies;
  language: SupportedLanguages;
}

export const InvoiceItemsSettings = memo(function InvoiceItemsSettings({
  control,
  formPrefixId,
  fields,
  handleRemoveItem,
  errors,
  currency,
  language,
  append,
}: InvoiceItemsSettingsProps) {
  const openPanel = useOpenPanel();
  return (
    <>
      <div className="mb-3 space-y-4">
        {/* Show Number column on PDF switch */}
        <div className="relative flex items-center justify-between">
          <Label htmlFor={`${formPrefixId}-itemInvoiceItemNumberIsVisible0`}>
            Show &quot;Number&quot; Column in the Invoice Items Table
          </Label>

          <Controller
            name={`items.0.invoiceItemNumberIsVisible`}
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                {...field}
                id={`${formPrefixId}-itemInvoiceItemNumberIsVisible0`}
                checked={value}
                onCheckedChange={onChange}
                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
              />
            )}
          />
        </div>

        {/* Show VAT Table Summary in PDF switch */}
        <div className="relative flex items-center justify-between">
          <Label htmlFor={`${formPrefixId}-vatTableSummaryIsVisible`}>
            Show &quot;VAT Table Summary&quot; in the PDF
          </Label>

          <Controller
            name={`vatTableSummaryIsVisible`}
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Switch
                {...field}
                id={`${formPrefixId}-vatTableSummaryIsVisible`}
                checked={value}
                onCheckedChange={onChange}
                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
              />
            )}
          />
        </div>
      </div>
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
                      onClick={() => handleRemoveItem(index)}
                      className="flex items-center justify-center rounded-full bg-red-600 p-2 transition-colors hover:bg-red-700"
                    >
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
                  <Label
                    htmlFor={`${formPrefixId}-itemName${index}`}
                    className=""
                  >
                    Name
                  </Label>

                  {/* Show/hide Name field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.nameFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemNameFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemNameFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content="Show/hide the 'Name of Goods/Service' Column in the PDF"
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
                      id={`${formPrefixId}-itemName${index}`}
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

              {/* Invoice Item Type of GTU */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label
                    htmlFor={`${formPrefixId}-itemTypeOfGTU${index}`}
                    className=""
                  >
                    Type of GTU
                  </Label>

                  {/* Show/hide Type of GTU field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.typeOfGTUFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemTypeOfGTUFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemTypeOfGTUFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show/hide the "Type of GTU" Column in the PDF'
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
                      id={`${formPrefixId}-itemTypeOfGTU${index}`}
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

              {/* Invoice Item Amount */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label
                    htmlFor={`${formPrefixId}-itemAmount${index}`}
                    className=""
                  >
                    Amount
                  </Label>

                  {/* Show/hide Amount field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.amountFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemAmountFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemAmountFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show/hide the "Amount" Column in the PDF'
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
                          id={`${formPrefixId}-itemAmount${index}`}
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
                  <Label
                    htmlFor={`${formPrefixId}-itemUnit${index}`}
                    className=""
                  >
                    Unit
                  </Label>

                  {/* Show/hide Unit field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.unitFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemUnitFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemUnitFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show/hide the "Unit" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* Unit input */}
                <Controller
                  name={`items.${index}.unit`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={`${formPrefixId}-itemUnit${index}`}
                      type="text"
                    />
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
                  <Label
                    htmlFor={`${formPrefixId}-itemNetPrice${index}`}
                    className=""
                  >
                    Net Price
                  </Label>

                  {/* Show/hide Net Price field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.netPriceFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemNetPriceFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemNetPriceFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show/hide the "Net Price" Column in the PDF'
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
                            id={`${formPrefixId}-itemNetPrice${index}`}
                            currency={currency}
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full"
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

              {/* Invoice Item VAT */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label
                    htmlFor={`${formPrefixId}-itemVat${index}`}
                    className=""
                  >
                    VAT
                  </Label>

                  {/* Show/hide VAT field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.vatFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemVatFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemVatFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show/hide the "VAT" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* VAT input */}
                <Controller
                  name={`items.${index}.vat`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={`${formPrefixId}-itemVat${index}`}
                      type="text"
                      className=""
                    />
                  )}
                />

                {errors.items?.[index]?.vat ? (
                  <ErrorMessage>{errors.items[index].vat.message}</ErrorMessage>
                ) : (
                  <InputHelperMessage>
                    Enter NP, OO or percentage value (0-100)
                  </InputHelperMessage>
                )}
              </div>

              {/* Invoice Item Net Amount */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label
                    htmlFor={`${formPrefixId}-itemNetAmount${index}`}
                    className=""
                  >
                    Net Amount
                  </Label>

                  {/* Show/hide Net Amount field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.netAmountFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemNetAmountFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemNetAmountFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show/hide the "Net Amount" Column in the PDF'
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
                        id={`${formPrefixId}-itemNetAmount${index}`}
                        currency={currency}
                        value={field.value.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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

              {/* Invoice Item VAT Amount (calculated automatically) */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label
                    htmlFor={`${formPrefixId}-itemVatAmount${index}`}
                    className=""
                  >
                    VAT Amount
                  </Label>

                  {/* Show/hide VAT Amount field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.vatAmountFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemVatAmountFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemVatAmountFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show/hide the "VAT Amount" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* VAT amount input */}
                <Controller
                  name={`items.${index}.vatAmount`}
                  control={control}
                  render={({ field }) => (
                    <ReadOnlyMoneyInput
                      {...field}
                      id={`${formPrefixId}-itemVatAmount${index}`}
                      currency={currency}
                      value={field.value.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    />
                  )}
                />

                {errors.items?.[index]?.vatAmount ? (
                  <ErrorMessage>
                    {errors.items[index].vatAmount.message}
                  </ErrorMessage>
                ) : (
                  <InputHelperMessage>
                    Calculated automatically based on Net Amount and VAT
                  </InputHelperMessage>
                )}
              </div>

              {/* Pre-tax Amount field */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label
                    htmlFor={`${formPrefixId}-itemPreTaxAmount${index}`}
                    className=""
                  >
                    Pre-tax Amount
                  </Label>

                  {/* Show/hide Pre-tax Amount field in PDF switch */}
                  {isFirstItem ? (
                    <div className="inline-flex items-center gap-2">
                      <Controller
                        name={`items.${index}.preTaxAmountFieldIsVisible`}
                        control={control}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Switch
                            {...field}
                            id={`${formPrefixId}-itemPreTaxAmountFieldIsVisible${index}`}
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          />
                        )}
                      />
                      <CustomTooltip
                        trigger={
                          <Label
                            htmlFor={`${formPrefixId}-itemPreTaxAmountFieldIsVisible${index}`}
                          >
                            Show in PDF
                          </Label>
                        }
                        content='Show/hide the "Pre-tax Amount" Column in the PDF'
                      />
                    </div>
                  ) : null}
                </div>

                {/* Pre-tax amount input */}
                <Controller
                  name={`items.${index}.preTaxAmount`}
                  control={control}
                  render={({ field }) => (
                    <ReadOnlyMoneyInput
                      {...field}
                      id={`${formPrefixId}-itemPreTaxAmount${index}`}
                      currency={currency}
                      value={field.value.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    />
                  )}
                />

                {errors.items?.[index]?.preTaxAmount ? (
                  <ErrorMessage>
                    {errors.items[index].preTaxAmount.message}
                  </ErrorMessage>
                ) : (
                  <InputHelperMessage>
                    Calculated automatically based on Net Amount and VAT
                  </InputHelperMessage>
                )}
              </div>
            </div>
          </fieldset>
        );
      })}
      <button
        type="button"
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
          openPanel.track("add_invoice_item");
          umamiTrackEvent("add_invoice_item");
        }}
        className="mb-1 flex items-center text-sm font-medium text-gray-700 hover:text-black"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add invoice item
      </button>
    </>
  );
});
