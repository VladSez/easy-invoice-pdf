"use client";

import {
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  accordionSchema,
  invoiceItemSchema,
  invoiceSchema,
  type AccordionState,
  type InvoiceData,
  type InvoiceItemData,
} from "@/app/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ButtonHelper } from "@/components/ui/button-helper";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { ReadOnlyMoneyInput } from "@/components/ui/money-input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import dayjs from "dayjs";
import { AlertTriangle } from "lucide-react";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { BuyerInformation } from "./sections/buyer-information";
import { GeneralInformation } from "./sections/general-information";
import { InvoiceItems } from "./sections/invoice-items";
import { SellerInformation } from "./sections/seller-information";

export const PDF_DATA_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_DATA";
export const LOADING_BUTTON_TIMEOUT = 400;
export const LOADING_BUTTON_TEXT = "Generating Document...";
const DEBOUNCE_TIMEOUT = 500;

const DEFAULT_ACCORDION_VALUES = [
  "general",
  "seller",
  "buyer",
  "invoiceItems",
] as const;

const ACCORDION_GENERAL = DEFAULT_ACCORDION_VALUES[0];
const ACCORDION_SELLER = DEFAULT_ACCORDION_VALUES[1];
const ACCORDION_BUYER = DEFAULT_ACCORDION_VALUES[2];
const ACCORDION_ITEMS = DEFAULT_ACCORDION_VALUES[3];

type NonReadonly<T> = {
  -readonly [P in keyof T]: T[P] extends object ? NonReadonly<T[P]> : T[P];
};

const calculateItemTotals = (item: InvoiceItemData | null) => {
  if (!item) return null;

  const amount = Number(item.amount) || 0;
  const netPrice = Number(item.netPrice) || 0;
  const calculatedNetAmount = amount * netPrice;
  const formattedNetAmount = Number(calculatedNetAmount.toFixed(2));

  let vatAmount = 0;
  if (item.vat && item.vat !== "NP" && item.vat !== "OO") {
    vatAmount = (formattedNetAmount * Number(item.vat)) / 100;
  }

  const formattedVatAmount = Number(vatAmount.toFixed(2));
  const formattedPreTaxAmount = Number(
    (formattedNetAmount + formattedVatAmount).toFixed(2)
  );

  return {
    ...item,
    netAmount: formattedNetAmount,
    vatAmount: formattedVatAmount,
    preTaxAmount: formattedPreTaxAmount,
  };
};

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

const Legend = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLLegendElement>) => {
  return (
    <legend className="text-lg font-semibold text-gray-900" {...props}>
      {children}
    </legend>
  );
};

const AlertIcon = () => {
  return <AlertTriangle className="mr-1 inline-block h-3 w-3 text-amber-500" />;
};

type AccordionKeys = Array<(typeof DEFAULT_ACCORDION_VALUES)[number]>;

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

interface InvoiceFormProps {
  invoiceData: InvoiceData;
  onInvoiceDataChange: (updatedData: InvoiceData) => void;
}

export const InvoiceForm = memo(function InvoiceForm({
  invoiceData,
  onInvoiceDataChange,
}: InvoiceFormProps) {
  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoiceData,
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = form;

  const currency = useWatch({ control, name: "currency" });
  const invoiceItems = useWatch({ control, name: "items" });

  const dateOfIssue = useWatch({ control, name: "dateOfIssue" });

  const paymentDue = useWatch({ control, name: "paymentDue" });
  const language = useWatch({ control, name: "language" });

  const isPaymentDueBeforeDateOfIssue = dayjs(paymentDue).isBefore(
    dayjs(dateOfIssue)
  );

  // payment due date is 14 days after the date of issue or the same day
  const isPaymentDue14DaysFromDateOfIssue =
    dayjs(paymentDue).isAfter(dayjs(dateOfIssue).add(14, "days")) ||
    dayjs(paymentDue).isSame(dayjs(dateOfIssue).add(14, "days"));

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // calculate totals and other values when invoice items change
  useEffect(() => {
    // run validations before calculations because user can input invalid data
    const validatedItems = z.array(invoiceItemSchema).safeParse(invoiceItems);

    if (!validatedItems.success) {
      console.error("Invalid items:", validatedItems.error);
      return;
    }

    // Always calculate total, even when no items
    const total = invoiceItems?.length
      ? Number(
          invoiceItems
            .reduce((sum, item) => sum + (item?.preTaxAmount || 0), 0)
            .toFixed(2)
        )
      : 0;

    // Update total first
    setValue("total", total, { shouldValidate: true });

    // Skip rest of calculations if no items
    if (!invoiceItems?.length) return;

    // Check if any relevant values have changed
    const hasChanges = invoiceItems.some((item) => {
      const calculated = calculateItemTotals(item);
      return (
        calculated?.netAmount !== item.netAmount ||
        calculated?.vatAmount !== item.vatAmount ||
        calculated?.preTaxAmount !== item.preTaxAmount
      );
    });
    if (!hasChanges) return;

    // Only update if there are actual changes
    const updatedItems = invoiceItems
      .map(calculateItemTotals)
      .filter(Boolean) as InvoiceItemData[];

    // Batch updates
    updatedItems.forEach((item, index) => {
      setValue(`items.${index}`, item, {
        shouldValidate: false, // Prevent validation during intermediate updates
      });
    });
  }, [invoiceItems, setValue]);

  // regenerate pdf on every input change with debounce
  const debouncedRegeneratePdfOnFormChange = useDebouncedCallback(
    (data: InvoiceData) => {
      // submit form e.g. regenerates pdf and run form validations
      void handleSubmit(onSubmit)(data as unknown as React.BaseSyntheticEvent);

      // data should be already validated
      const stringifiedData = JSON.stringify(data);

      try {
        localStorage.setItem(PDF_DATA_LOCAL_STORAGE_KEY, stringifiedData);
      } catch (error) {
        console.error("Error saving to local storage:", error);

        Sentry.captureException(error);
      }
    },
    // debounce delay in ms
    DEBOUNCE_TIMEOUT
  );

  // subscribe to form changes to regenerate pdf on every input change
  useEffect(() => {
    const subscription = watch((value) => {
      debouncedRegeneratePdfOnFormChange(value as unknown as InvoiceData);
    });

    return () => subscription.unsubscribe();
  }, [debouncedRegeneratePdfOnFormChange, watch]);

  // Add a wrapper function for remove item that triggers the form update
  const handleRemoveItem = useCallback(
    (index: number) => {
      remove(index);

      // analytics track event
      umamiTrackEvent("remove_invoice_item");

      // Manually trigger form submission after removal
      const currentFormData = watch();
      debouncedRegeneratePdfOnFormChange(currentFormData);
    },
    [remove, watch, debouncedRegeneratePdfOnFormChange]
  );

  // TODO: refactor this and debouncedRegeneratePdfOnFormChange(), so data is saved to local storage, basically copy everything from debouncedRegeneratePdfOnFormChange() and use this onSubmit function in two places
  const onSubmit = (data: InvoiceData) => {
    onInvoiceDataChange(data);
  };

  /**
   * All open accordion sections will be in the array of strings
   * ['general', 'seller', 'invoiceItems'] -> means that general, seller and invoiceItems accordion sections are open
   * [] -> means that all accordion sections are closed
   */
  const [accordionValues, setAccordionValues] = useState<
    Prettify<AccordionKeys>
  >(() => {
    // Try to load from localStorage
    try {
      const savedState = localStorage.getItem(
        ACCORDION_STATE_LOCAL_STORAGE_KEY
      );

      if (savedState) {
        const parsedState = JSON.parse(savedState) as AccordionState;

        const validatedState = accordionSchema.safeParse(parsedState);

        if (validatedState.success) {
          const arrayOfOpenSections = Object.entries(validatedState.data)
            .filter(([_, isOpen]) => isOpen)
            .map(([section]) => section) as Prettify<AccordionKeys>;

          return arrayOfOpenSections;
        }
      }
    } catch (error) {
      console.error("Error loading accordion state:", error);

      Sentry.captureException(error);
    }

    // Default to all sections open if no valid state found
    return DEFAULT_ACCORDION_VALUES as NonReadonly<
      typeof DEFAULT_ACCORDION_VALUES
    >;
  });

  // Save accordion state changes to localStorage
  const handleAccordionValueChange = (value: Prettify<AccordionKeys>) => {
    setAccordionValues(value);

    try {
      // parse the value to the accordion schema
      const stateToSave = accordionSchema.parse({
        general: value.includes(ACCORDION_GENERAL),
        seller: value.includes(ACCORDION_SELLER),
        buyer: value.includes(ACCORDION_BUYER),
        invoiceItems: value.includes(ACCORDION_ITEMS),
      });

      localStorage.setItem(
        ACCORDION_STATE_LOCAL_STORAGE_KEY,
        JSON.stringify(stateToSave)
      );
    } catch (error) {
      console.error("Error saving accordion state:", error);

      Sentry.captureException(error);
    }
  };

  return (
    <form
      className="mb-4 space-y-3.5"
      onSubmit={handleSubmit(onSubmit, (errors) => {
        console.error("Form validation errors:", errors);
        toast.error(
          <div>
            <p className="font-semibold">Please fix the following errors:</p>
            <ul className="mt-1 list-inside list-disc">
              {Object.entries(errors)
                .map(([key, error]) => {
                  // Handle nested errors (e.g., seller.name, items[0].name)
                  if (
                    error &&
                    typeof error === "object" &&
                    "message" in error
                  ) {
                    return (
                      <li key={key} className="text-sm">
                        {error?.message || "Unknown error"}
                      </li>
                    );
                  }

                  // Handle array errors (e.g., items array)
                  if (Array.isArray(error)) {
                    return error.map((item, index) =>
                      Object.entries(
                        item as { [key: string]: { message?: string } }
                      ).map(([fieldName, fieldError]) => (
                        <li
                          key={`${key}.${index}.${fieldName}`}
                          className="text-sm"
                        >
                          {fieldError?.message || "Unknown error"}
                        </li>
                      ))
                    );
                  }

                  // Handle nested object errors
                  if (error && typeof error === "object") {
                    return Object.entries(
                      error as { [key: string]: { message?: string } }
                    ).map(([nestedKey, nestedError]) => {
                      return (
                        <li key={`${key}.${nestedKey}`} className="text-sm">
                          {nestedError?.message || "Unknown error"}
                        </li>
                      );
                    });
                  }

                  return null;
                })
                .flat(Infinity)}
            </ul>
          </div>,
          {
            closeButton: true,
          }
        );
      })}
    >
      <Accordion
        type="multiple"
        value={accordionValues}
        onValueChange={handleAccordionValueChange}
        className="space-y-4"
      >
        {/* General Information */}
        <AccordionItem
          value={ACCORDION_GENERAL}
          className="rounded-lg border shadow"
          data-testid={`general-information-section`}
        >
          <AccordionTrigger className="px-4 py-3">
            <Legend>General Information</Legend>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <GeneralInformation
              control={control}
              errors={errors}
              setValue={setValue}
              dateOfIssue={dateOfIssue}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Seller Information */}
        <AccordionItem
          value={ACCORDION_SELLER}
          className="rounded-lg border shadow"
          data-testid={`seller-information-section`}
        >
          <AccordionTrigger className="px-4 py-3">
            <Legend>Seller Information</Legend>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <SellerInformation
              control={control}
              errors={errors}
              setValue={setValue}
              invoiceData={invoiceData}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Buyer Information */}
        <AccordionItem
          value={ACCORDION_BUYER}
          className="rounded-lg border shadow"
          data-testid={`buyer-information-section`}
        >
          <AccordionTrigger className="px-4 py-3">
            <Legend>Buyer Information</Legend>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <BuyerInformation
              control={control}
              errors={errors}
              setValue={setValue}
              invoiceData={invoiceData}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Invoice Items */}
        <AccordionItem
          value={ACCORDION_ITEMS}
          className="rounded-lg border shadow"
          data-testid={`invoice-items-section`}
        >
          <AccordionTrigger className="px-4 py-3">
            <Legend>Invoice Items</Legend>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <InvoiceItems
              control={control}
              fields={fields}
              handleRemoveItem={handleRemoveItem}
              errors={errors}
              currency={currency}
              language={language}
              append={append}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Final section */}
      <div className="space-y-4" data-testid={`final-section`}>
        <div className="">
          {/* Total field (with currency) */}
          <div className="mt-5" />
          <Label htmlFor={`total`} className="mb-1">
            Total
          </Label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <Controller
              name="total"
              control={control}
              render={({ field }) => (
                <ReadOnlyMoneyInput
                  {...field}
                  id={`total`}
                  currency={currency}
                  value={field.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                />
              )}
            />
          </div>
          {errors.total ? (
            <ErrorMessage>{errors.total.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Calculated automatically based on (Net Amount + VAT Amount) *
              Number of invoice items
            </InputHelperMessage>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <div className="relative mb-2 mt-6 flex items-center justify-between">
            <Label htmlFor={`paymentMethod`} className="">
              Payment Method
            </Label>

            {/* Show/hide Payment Method field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`paymentMethodFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`paymentMethodFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`paymentMethodFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content='Show/Hide the "Payment Method" Field in the PDF'
              />
            </div>
          </div>

          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={`paymentMethod`}
                type="text"
                className="mt-1"
              />
            )}
          />
          {errors.paymentMethod && (
            <ErrorMessage>{errors.paymentMethod.message}</ErrorMessage>
          )}
        </div>

        {/* Payment Due */}
        <div>
          <div className="mb-6">
            <Label htmlFor={`paymentDue`} className="mb-1">
              Payment Due
            </Label>
            <Controller
              name="paymentDue"
              control={control}
              render={({ field }) => (
                <Input {...field} id={`paymentDue`} type="date" className="" />
              )}
            />
            {errors.paymentDue && (
              <ErrorMessage>{errors.paymentDue.message}</ErrorMessage>
            )}
            {!errors.paymentDue && isPaymentDueBeforeDateOfIssue ? (
              <InputHelperMessage>
                <span className="flex items-center text-balance">
                  <AlertIcon />
                  Payment due date is before date of issue (
                  {dayjs(dateOfIssue).format("DD.MM.YYYY")})
                </span>
                <ButtonHelper
                  onClick={() => {
                    const newPaymentDue = dayjs(dateOfIssue)
                      .add(14, "days")
                      .format("YYYY-MM-DD");

                    setValue("paymentDue", newPaymentDue);
                  }}
                >
                  Click to set payment due date 14 days after the date of issue
                  ({dayjs(dateOfIssue).add(14, "days").format("DD/MM/YYYY")})
                </ButtonHelper>
              </InputHelperMessage>
            ) : null}
            {/* If there are no errors and the payment due date is not before the date of issue and the payment due date is not 14 days after the date of issue, show the button to set the payment due date to 14 days after the date of issue (probably a bit better UX) */}
            {!errors.paymentDue &&
            !isPaymentDueBeforeDateOfIssue &&
            !isPaymentDue14DaysFromDateOfIssue ? (
              <ButtonHelper
                className="whitespace-normal"
                onClick={() => {
                  const newPaymentDue = dayjs(dateOfIssue)
                    .add(14, "days")
                    .format("YYYY-MM-DD");

                  setValue("paymentDue", newPaymentDue);
                }}
              >
                Click to set payment due date 14 days after the date of issue (
                {dayjs(dateOfIssue).add(14, "days").format("DD/MM/YYYY")})
              </ButtonHelper>
            ) : null}
          </div>
        </div>

        {/* Notes */}
        <div className="">
          <div className="relative mb-2 flex items-center justify-between">
            <Label htmlFor={`notes`} className="">
              Notes
            </Label>

            {/* Show/hide Notes field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`notesFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`notesFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`notesFieldIsVisible`}>Show in PDF</Label>
                }
                content='Show/Hide the "Notes" Field in the PDF'
              />
            </div>
          </div>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`notes`}
                rows={3}
                className=""
                data-testid="notes"
              />
            )}
          />
          {errors?.notes && (
            <ErrorMessage>{errors?.notes?.message}</ErrorMessage>
          )}
        </div>

        <div>
          <div className="relative mt-5 space-y-4">
            {/* Show/hide Person Authorized to Receive field in PDF switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor={`personAuthorizedToReceiveFieldIsVisible`}>
                Show &quot;Person Authorized to Receive&quot; Signature Field in
                the PDF
              </Label>

              <Controller
                name={`personAuthorizedToReceiveFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`personAuthorizedToReceiveFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
            </div>

            {/* Show/hide Person Authorized to Issue field in PDF switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor={`personAuthorizedToIssueFieldIsVisible`}>
                Show &quot;Person Authorized to Issue&quot; Signature Field in
                the PDF
              </Label>

              <Controller
                name={`personAuthorizedToIssueFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`personAuthorizedToIssueFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
});
