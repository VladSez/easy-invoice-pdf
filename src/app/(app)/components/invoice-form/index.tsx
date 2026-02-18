"use client";

import {
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  accordionSchema,
  invoiceItemSchema,
  invoiceSchema,
  PDF_DATA_LOCAL_STORAGE_KEY,
  type AccordionState,
  type InvoiceData,
  type InvoiceItemData,
} from "@/app/schema";
import { Legend } from "@/components/legend";
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
import type { NonReadonly, Prettify } from "@/types";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import dayjs from "dayjs";
import React, {
  memo,
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";

import { AlertIcon, ErrorMessage } from "./common";
import { BuyerInformation } from "./sections/buyer-information";
import { GeneralInformation } from "./sections/general-information";
import { InvoiceItems } from "./sections/invoice-items";
import { SellerInformation } from "./sections/seller-information";
import { updateAppMetadata } from "@/app/(app)/utils/get-app-metadata";

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

type AccordionKeys = Array<(typeof DEFAULT_ACCORDION_VALUES)[number]>;

interface InvoiceFormProps {
  invoiceData: InvoiceData;
  handleInvoiceDataChange: (updatedData: InvoiceData) => void;
  setCanShareInvoice: (canShareInvoice: boolean) => void;
  isMobile?: boolean;
  setInvoiceFormHasErrors: Dispatch<SetStateAction<boolean>>;
}

export const InvoiceForm = memo(function InvoiceForm({
  invoiceData,
  handleInvoiceDataChange,
  setCanShareInvoice,
  isMobile = false,
  setInvoiceFormHasErrors,
}: InvoiceFormProps) {
  const form = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoiceData,
    mode: "onChange",
  });

  const {
    control,
    setValue,
    formState: { errors },
    watch,
    trigger,
  } = form;

  const currency = useWatch({ control, name: "currency" });
  const invoiceItems = useWatch({ control, name: "items" });

  const dateOfIssue = useWatch({ control, name: "dateOfIssue" });

  const paymentDue = useWatch({ control, name: "paymentDue" });
  const language = useWatch({ control, name: "language" });
  const selectedDateFormat = useWatch({ control, name: "dateFormat" });

  const isPaymentDueBeforeDateOfIssue = dayjs(paymentDue).isBefore(
    dayjs(dateOfIssue),
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
            .toFixed(2),
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

  // top level of component
  const debouncedShowFormErrorsToast = useDebouncedCallback(
    () => formErrorsToToast({ errors, isMobile }),
    isMobile ? 3000 : 1000,
  );

  // regenerate pdf on every input change with debounce
  const debouncedRegeneratePdfOnFormChange = useDebouncedCallback(
    async (data: InvoiceData) => {
      // close all other toasts (if any)
      toast.dismiss();
      setInvoiceFormHasErrors(false);

      // TODO: double check if we need this code, because we already save to local storage in the page.client.tsx (parent component) (line: 267) useEffect "Save to localStorage whenever data changes on form update"
      try {
        // trigger form validations
        const ok = await trigger(undefined, { shouldFocus: true });

        if (!ok) {
          // show errors to the user
          // Debounce error toast to avoid showing too fast
          debouncedShowFormErrorsToast();

          setInvoiceFormHasErrors(true);

          return;
        }

        const validatedData = invoiceSchema.parse(data);

        const stringifiedData = JSON.stringify(validatedData);

        localStorage.setItem(PDF_DATA_LOCAL_STORAGE_KEY, stringifiedData);

        // pass the updated data to the parent component, to update the invoice data state (use state hook)
        onSubmit(validatedData);
      } catch (error) {
        console.error("Error saving to local storage:", error);

        Sentry.captureException(error);
      }
    },
    // debounce delay in ms
    DEBOUNCE_TIMEOUT,
  );

  // IMPORTANT
  // TODO: rewrite to subscribe()? https://react-hook-form.com/docs/useform/subscribe
  // subscribe to form changes to regenerate pdf on every input change
  useEffect(() => {
    const subscription = watch((value) => {
      void debouncedRegeneratePdfOnFormChange(value as unknown as InvoiceData);
    });

    return () => subscription.unsubscribe();
  }, [debouncedRegeneratePdfOnFormChange, watch]);

  const template = useWatch({ control, name: "template" });
  const logo = useWatch({ control, name: "logo" });
  const taxLabelText = useWatch({ control, name: "taxLabelText" }) || "VAT";

  // Disable sharing when Stripe template contains a logo (we can't put the logo base64 string in the URL due to browser URL length limits)
  useEffect(() => {
    const canShareInvoice = !(template === "stripe" && Boolean(logo));

    setCanShareInvoice(canShareInvoice);
  }, [template, logo, setCanShareInvoice]);

  // Add a wrapper function for remove item that triggers the form update
  const handleRemoveItem = useCallback(
    (index: number) => {
      remove(index);

      // analytics track event
      umamiTrackEvent("remove_invoice_item");

      // Manually trigger form submission after removal
      const currentFormData = watch();
      void debouncedRegeneratePdfOnFormChange(currentFormData);
    },
    [remove, watch, debouncedRegeneratePdfOnFormChange],
  );

  const onSubmit = (data: InvoiceData) => {
    // pass the updated data to the parent component
    handleInvoiceDataChange(data);

    // update the `invoiceLastUpdatedAt` timestamp when the form is submitted (i.e. invoice is regenerated)
    // this is used to display the last updated at timestamp in the invoice preview
    updateAppMetadata((current) => {
      return {
        ...current,
        invoiceLastUpdatedAt: dayjs().toISOString(),
      };
    });
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
        ACCORDION_STATE_LOCAL_STORAGE_KEY,
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
        JSON.stringify(stateToSave),
      );
    } catch (error) {
      console.error("Error saving accordion state:", error);

      Sentry.captureException(error);
    }
  };

  return (
    <form className="relative mb-4 space-y-3.5">
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
              template={template}
              taxLabelText={taxLabelText}
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

        {/* Payment Method (Only show for default template) */}
        {template === "default" && (
          <div>
            <div className="relative mb-2 mt-6 flex items-center justify-between">
              <Label htmlFor={`paymentMethod`} className="">
                Payment Method
              </Label>

              {/* Show Payment Method field in PDF switch */}
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
                      data-testid="paymentMethodFieldIsVisible"
                    />
                  )}
                />
                <CustomTooltip
                  trigger={
                    <Label htmlFor={`paymentMethodFieldIsVisible`}>
                      Show in PDF
                    </Label>
                  }
                  content='Show the "Payment Method" Field in the PDF'
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
        )}

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
            {!errors.paymentDue &&
            isPaymentDueBeforeDateOfIssue &&
            dateOfIssue ? (
              <InputHelperMessage>
                <span className="flex items-center text-balance text-amber-800">
                  <AlertIcon />
                  Payment due date is before date of issue (
                  {dayjs(dateOfIssue).format(selectedDateFormat)})
                </span>
                <ButtonHelper
                  onClick={() => {
                    const newPaymentDue = dayjs(dateOfIssue)
                      .add(14, "days")
                      .format("YYYY-MM-DD"); // default browser date input format is YYYY-MM-DD

                    setValue("paymentDue", newPaymentDue);
                  }}
                >
                  <span className="text-pretty">
                    Set payment due date to{" "}
                    {dayjs(dateOfIssue)
                      .add(14, "days")
                      .format(selectedDateFormat)}{" "}
                    (14 days from issue date)
                  </span>
                </ButtonHelper>
              </InputHelperMessage>
            ) : null}
            {/* If there are no errors and the payment due date is not before the date of issue and the payment due date is not 14 days after the date of issue, show the button to set the payment due date to 14 days after the date of issue (probably a bit better UX) */}
            {!errors.paymentDue &&
            !isPaymentDueBeforeDateOfIssue &&
            !isPaymentDue14DaysFromDateOfIssue &&
            dateOfIssue ? (
              <InputHelperMessage>
                <ButtonHelper
                  className="whitespace-normal"
                  onClick={() => {
                    const newPaymentDue = dayjs(dateOfIssue)
                      .add(14, "days")
                      .format("YYYY-MM-DD");

                    setValue("paymentDue", newPaymentDue);
                  }}
                >
                  <span className="text-pretty">
                    Set payment due date to{" "}
                    {dayjs(dateOfIssue)
                      .add(14, "days")
                      .format(selectedDateFormat)}{" "}
                    (14 days from issue date)
                  </span>
                </ButtonHelper>
              </InputHelperMessage>
            ) : null}
          </div>
        </div>

        {/* Notes */}
        <div className="">
          <div className="relative mb-2 flex items-center justify-between">
            <Label htmlFor={`notes`} className="">
              Notes
            </Label>

            {/* Show Notes field in PDF switch */}
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
                content='Show the "Notes" Field in the PDF'
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

        {/* QR Code */}
        <fieldset className="rounded-md border px-4 pb-4">
          <legend className="text-base font-semibold lg:text-lg">
            QR Code
          </legend>

          <div className="mb-2 flex items-center justify-end">
            {/* Show QR Code in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`qrCodeIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`qrCodeIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                    aria-label="Show QR Code in PDF"
                  />
                )}
              />
              <CustomTooltip
                trigger={<Label htmlFor={`qrCodeIsVisible`}>Show in PDF</Label>}
                content="Show the QR Code in the PDF"
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* QR Code Data */}
            <div>
              <Label htmlFor={`qrCodeData`} className="mb-2 block">
                Data
              </Label>
              <Controller
                name="qrCodeData"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`qrCodeData`}
                    type="text"
                    placeholder="Enter URL or text to encode"
                    data-testid="qrCodeData"
                  />
                )}
              />
              <InputHelperMessage>
                Enter any text or URL to generate a QR code. The QR code will
                appear in the bottom section of the invoice PDF.
              </InputHelperMessage>
              {errors.qrCodeData && (
                <ErrorMessage>{errors.qrCodeData.message}</ErrorMessage>
              )}
            </div>

            {/* QR Code Description */}
            <div>
              <Label htmlFor={`qrCodeDescription`} className="mb-2 block">
                Description (optional)
              </Label>
              <Controller
                name="qrCodeDescription"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id={`qrCodeDescription`}
                    type="text"
                    placeholder="Enter a description for the QR code"
                    data-testid="qrCodeDescription"
                  />
                )}
              />
              <InputHelperMessage>
                Optional text that will be displayed below the QR code in the
                PDF.
              </InputHelperMessage>
              {errors.qrCodeDescription && (
                <ErrorMessage>{errors.qrCodeDescription.message}</ErrorMessage>
              )}
            </div>
          </div>
        </fieldset>

        {/*
            Stripe template doesn't have these fields
        */}
        {invoiceData.template === "default" && (
          <>
            <fieldset className="rounded-md border px-4 pb-4">
              <legend className="text-base font-semibold lg:text-lg">
                Person Authorized to Receive
              </legend>

              <div className="mb-2 flex items-center justify-end">
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="personAuthorizedToReceiveFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Switch
                        {...field}
                        id="personAuthorizedToReceiveFieldIsVisible"
                        checked={value}
                        onCheckedChange={onChange}
                        className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                        aria-label="Show Person Authorized to Receive in PDF"
                      />
                    )}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor="personAuthorizedToReceiveFieldIsVisible">
                        Show in PDF
                      </Label>
                    }
                    content="Show the Person Authorized to Receive signature field in the PDF"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="personAuthorizedToReceiveName"
                  className="mb-2 block"
                >
                  Name
                </Label>
                <Controller
                  name="personAuthorizedToReceiveName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="personAuthorizedToReceiveName"
                      type="text"
                      placeholder="Enter name of person authorized to receive"
                      data-testid="personAuthorizedToReceiveName"
                    />
                  )}
                />
                <InputHelperMessage>
                  Name displayed above the signature line in the PDF.
                </InputHelperMessage>
                {errors.personAuthorizedToReceiveName && (
                  <ErrorMessage>
                    {errors.personAuthorizedToReceiveName.message}
                  </ErrorMessage>
                )}
              </div>
            </fieldset>

            <fieldset className="rounded-md border px-4 pb-4">
              <legend className="text-base font-semibold lg:text-lg">
                Person Authorized to Issue
              </legend>

              <div className="mb-2 flex items-center justify-end">
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="personAuthorizedToIssueFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Switch
                        {...field}
                        id="personAuthorizedToIssueFieldIsVisible"
                        checked={value}
                        onCheckedChange={onChange}
                        className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                        aria-label="Show Person Authorized to Issue in PDF"
                      />
                    )}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor="personAuthorizedToIssueFieldIsVisible">
                        Show in PDF
                      </Label>
                    }
                    content="Show the Person Authorized to Issue signature field in the PDF"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="personAuthorizedToIssueName"
                  className="mb-2 block"
                >
                  Name
                </Label>
                <Controller
                  name="personAuthorizedToIssueName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="personAuthorizedToIssueName"
                      type="text"
                      placeholder="Enter name of person authorized to issue"
                      data-testid="personAuthorizedToIssueName"
                    />
                  )}
                />
                <InputHelperMessage>
                  Name displayed above the signature line in the PDF.
                </InputHelperMessage>
                {errors.personAuthorizedToIssueName && (
                  <ErrorMessage>
                    {errors.personAuthorizedToIssueName.message}
                  </ErrorMessage>
                )}
              </div>
            </fieldset>
          </>
        )}
      </div>
    </form>
  );
});

const calculateItemTotals = (item: InvoiceItemData | null) => {
  if (!item) return null;

  const amount = Number(item.amount) || 0;
  const netPrice = Number(item.netPrice) || 0;
  const calculatedNetAmount = amount * netPrice;
  const formattedNetAmount = Number(calculatedNetAmount.toFixed(2));

  let vatAmount = 0;

  // item.vat always come as a string, so we need to convert it to a number ("23" -> 23) to calculate the VAT amount
  // it also can be not a number (e.g. "NP", "OO", etc), in this case we don't calculate the VAT amount and set it to 0
  if (item?.vat) {
    const vatValue = Number(item.vat);
    const isVatValueANumber = !Number.isNaN(vatValue);

    if (isVatValueANumber) {
      vatAmount = (formattedNetAmount * vatValue) / 100;
    }
  }

  const formattedVatAmount = Number(vatAmount.toFixed(2));
  const formattedPreTaxAmount = Number(
    (formattedNetAmount + formattedVatAmount).toFixed(2),
  );

  return {
    ...item,
    netAmount: formattedNetAmount,
    vatAmount: formattedVatAmount,
    preTaxAmount: formattedPreTaxAmount,
  };
};

const formErrorsToToast = ({
  errors,
  isMobile,
}: {
  errors: FieldErrors<InvoiceData>;
  isMobile: boolean;
}) => {
  // Return early if there are no errors
  if (!errors || Object.keys(errors).length === 0) {
    return;
  }
  toast.error(
    <div>
      <p className="font-semibold">Please fix the following errors:</p>
      <ul className="mt-1 list-inside list-disc">
        {Object.entries(errors)
          .map(([key, error]) => {
            // Handle nested errors (e.g., seller.name, items[0].name)
            if (error && typeof error === "object" && "message" in error) {
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
                  item as { [key: string]: { message?: string } },
                ).map(([fieldName, fieldError]) => (
                  <li key={`${key}.${index}.${fieldName}`} className="text-sm">
                    {fieldError?.message || "Unknown error"}
                  </li>
                )),
              );
            }

            // Handle nested object errors
            if (error && typeof error === "object") {
              return Object.entries(
                error as { [key: string]: { message?: string } },
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
      duration: 15_000,
      position: isMobile ? "top-center" : "bottom-right",
    },
  );
};
