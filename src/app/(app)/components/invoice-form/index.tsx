"use client";

import * as Sentry from "@sentry/nextjs";
import dayjs from "dayjs";
import { memo, useCallback, useEffect, useState, type RefObject } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(app)/utils/app-local-storage";
import { formatDateWithLocale } from "@/app/(app)/utils/format-date-with-locale";
import { updateAppMetadata } from "@/app/(app)/utils/get-app-metadata";
import {
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  accordionSchema,
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
import { zodResolverForOutput } from "@/lib/zod-resolver-for-output";
import type { NonReadonly, Prettify } from "@/types";

import { AlertIcon, ErrorMessage } from "./common";
import { BuyerInformation } from "./sections/buyer-information";
import { GeneralInformation } from "./sections/general-information";
import { InvoiceItems } from "./sections/invoice-items";
import { SellerInformation } from "./sections/seller-information";
import { calculateInvoiceTotal } from "./utils/calculate-invoice-total";
import { calculateItemTotals } from "./utils/calculate-item-totals";
import { formErrorsToToast } from "./utils/form-errors-to-toast";
import { hasAnyItemTotalsChanged } from "./utils/has-item-totals-changed";
import { parseValidatedInvoiceItems } from "./utils/validated-invoice-items";

/**
 * Time in milliseconds to debounce updates in the invoice form,
 * e.g. for delayed applying of changes before persisting/syncing.
 */
const DEBOUNCE_TIMEOUT = 500;

/**
 * Default values for the invoice form's accordion sections.
 * These correspond to the different sections of the form that can be expanded or collapsed.
 */
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
  isMobile?: boolean;
  /**
   * Filled in with a getter returning the form's current values, or `null` when the form
   * has validation errors. The parent only needs this when the user clicks "Get link", so
   * it asks at that moment rather than mirroring form state into its own render.
   */
  currentInvoiceFormDataRef?: RefObject<(() => InvoiceData | null) | null>;
  /**
   * Filled in with a function that commits a pending (debounced) edit immediately, so the
   * parent can flush the form before the user's attention moves elsewhere.
   */
  flushPendingChangesRef?: RefObject<(() => void) | null>;
}

export const InvoiceForm = memo(function InvoiceForm({
  invoiceData,
  handleInvoiceDataChange,
  isMobile = false,
  currentInvoiceFormDataRef,
  flushPendingChangesRef,
}: InvoiceFormProps) {
  const form = useForm<InvoiceData>({
    resolver: zodResolverForOutput(invoiceSchema),
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

  // Helper texts quote dates back to the user, so they are formatted the way the
  // PDF will render them: the invoice's date format AND its language.
  const formattedDateOfIssue = formatDateWithLocale({
    date: dateOfIssue,
    selectedDateFormat,
    language,
  });
  const formattedSuggestedPaymentDue = formatDateWithLocale({
    date: dayjs(dateOfIssue).add(14, "days"),
    selectedDateFormat,
    language,
  });

  const { fields, append } = useFieldArray({
    control,
    name: "items",
  });

  // calculate totals and other values when invoice items change
  useEffect(() => {
    // Bail out while the user is mid-edit with input the schema rejects, so we
    // never turn half-typed values into totals and write them back. Clearing the
    // amount field to retype it would otherwise zero out the item's totals, and
    // a VAT of 500 would persist a bogus tax amount.
    // `zodResolver` does not do this for us: it populates `errors`, but form
    // state (and so `useWatch`) still holds the raw, unvalidated input.
    const validatedItemsResult = parseValidatedInvoiceItems(invoiceItems);

    if (!validatedItemsResult.success) {
      console.error("Invalid items:", validatedItemsResult.error);

      Sentry.captureException(validatedItemsResult.error);

      return;
    }

    const total = calculateInvoiceTotal(invoiceItems);

    console.info(
      "[useEffect] recalculating totals because invoice items changed",
      {
        invoiceItems,
        validatedItemsResult,
        total,
      },
    );

    // Update total first
    setValue("total", total, { shouldValidate: true });

    // Skip rest of calculations if no items
    if (!invoiceItems?.length) return;

    // if no item totals changed (netAmount, vatAmount, preTaxAmount), skip the rest of the calculations
    if (!hasAnyItemTotalsChanged(invoiceItems)) return;

    // Only update if there are actual changes
    const updatedItems = invoiceItems
      .map((item) => {
        return calculateItemTotals(item);
      })
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
    () => {
      return formErrorsToToast({ errors, isMobile });
    },
    isMobile ? 3000 : 1000,
  );

  // regenerate pdf on every input change with debounce
  const debouncedRegeneratePdfOnFormChange = useDebouncedCallback(
    async (data: InvoiceData) => {
      // close those toasts after user has made changes to the form for better UX
      toast.dismiss("form-errors-error-toast");
      toast.dismiss("invoice-has-changed-toast");
      toast.dismiss("invalid-invoice-url-error-toast");
      toast.dismiss("unable-to-share-invoice-form-errors-toast");

      // TODO: double check if we need this code, because we already save to local storage in the page.client.tsx (parent component) (line: 267) useEffect "Save to localStorage whenever data changes on form update"
      try {
        // trigger form validations
        const ok = await trigger(undefined, { shouldFocus: true });

        if (!ok) {
          // show errors to the user
          // Debounce error toast to avoid showing too fast
          debouncedShowFormErrorsToast();

          return;
        }

        const validatedData = invoiceSchema.parse(data);

        const stringifiedData = JSON.stringify(validatedData);

        // Persisting is best-effort and must never gate `onSubmit`: when storage is
        // unavailable (an iOS in-app webview exposes `localStorage` as `null`) an
        // unguarded write threw here, so the edit never reached the parent and the PDF
        // preview stayed frozen on the previous version for the whole session.
        setAppStorageItem({
          key: PDF_DATA_LOCAL_STORAGE_KEY,
          value: stringifiedData,
        });

        // pass the updated data to the parent component, to update the invoice data state (use state hook)
        onSubmit(validatedData);
      } catch (error) {
        console.error("Error regenerating invoice from form change:", error);

        Sentry.captureException(error);
      }
    },
    // debounce delay in ms
    DEBOUNCE_TIMEOUT,
  );

  // Let the parent read the form at click time: both whether it is valid, and what is
  // currently in it.
  //
  // Both used to lag by DEBOUNCE_TIMEOUT. The validity flag was pushed up from inside
  // debouncedRegeneratePdfOnFormChange, and the data the parent shares is only committed
  // on that same debounce. `mode: "onChange"` renders the inline error immediately, so
  // for those 500ms the user could see "Net price is required" and still have "Get link"
  // produce a link for an invalid invoice, and a click just after any edit shared the
  // pre-edit snapshot. Reading on demand cannot go stale, and the answer is only ever
  // needed in an event handler — never during render.
  //
  // `formState.errors` covers both validation paths: onChange populates it per field, and
  // the debounced trigger(undefined) fills in fields the user never touched.
  useEffect(() => {
    if (!currentInvoiceFormDataRef) {
      return;
    }

    // This function allows the parent component to access the current state of the invoice form data.
    // It checks if there are any validation errors in the form (via formState.errors).
    // If errors exist, it returns null, indicating the form data is not currently valid.
    // Otherwise, it returns the current form values.
    currentInvoiceFormDataRef.current = () => {
      if (Object.keys(form.formState.errors).length > 0) {
        // There are validation errors; signal invalid data to the parent.
        return null;
      }
      // No validation errors; provide the current form values to the parent.
      return form.getValues();
    };

    return () => {
      currentInvoiceFormDataRef.current = null;
    };
  }, [form, currentInvoiceFormDataRef]);

  // IMPORTANT
  // TODO: rewrite to subscribe()? https://react-hook-form.com/docs/useform/subscribe
  // subscribe to form changes to regenerate pdf on every input change
  useEffect(() => {
    // oxlint-disable-next-line react/incompatible-library
    const subscription = watch((value) => {
      void debouncedRegeneratePdfOnFormChange(value as unknown as InvoiceData);
    });

    return () => {
      return subscription.unsubscribe();
    };
  }, [debouncedRegeneratePdfOnFormChange, watch]);

  // Hands the parent a way to commit a pending edit right away instead of waiting out the
  // debounce. The mobile tabs use it when the user leaves the form for the PDF preview, so
  // the preview shows what was just typed instead of the previous version for half a second.
  useEffect(() => {
    if (!flushPendingChangesRef) {
      return;
    }

    flushPendingChangesRef.current = () => {
      // a no-op when nothing is pending
      void debouncedRegeneratePdfOnFormChange.flush();
    };

    return () => {
      flushPendingChangesRef.current = null;
    };
  }, [debouncedRegeneratePdfOnFormChange, flushPendingChangesRef]);

  const template = useWatch({ control, name: "template" });
  const taxLabelText = useWatch({ control, name: "taxLabelText" }) || "VAT";

  /**
   * Remove an invoice item from the form and trigger the form update
   *
   * @param index - The index of the invoice item to remove
   */
  const handleRemoveInvoiceItem = useCallback(
    (index: number) => {
      setValue(
        "items",
        invoiceItems.filter((_, i) => {
          return i !== index;
        }),
        {
          shouldValidate: true,
          shouldTouch: true,
          shouldDirty: true,
        },
      );

      toast.success("Invoice item removed successfully", {
        id: "invoice-item-removed-success",
        closeButton: true,
        richColors: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      // analytics track event
      umamiTrackEvent("remove_invoice_item");
    },
    [invoiceItems, setValue, isMobile],
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
      const savedState = getAppStorageItem(ACCORDION_STATE_LOCAL_STORAGE_KEY);

      if (savedState) {
        const parsedState = JSON.parse(savedState) as AccordionState;

        const validatedState = accordionSchema.safeParse(parsedState);

        if (validatedState.success) {
          const arrayOfOpenSections = Object.entries(validatedState.data)
            .filter(([_, isOpen]) => {
              return isOpen;
            })
            .map(([section]) => {
              return section;
            }) as Prettify<AccordionKeys>;

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

      setAppStorageItem({
        key: ACCORDION_STATE_LOCAL_STORAGE_KEY,
        value: JSON.stringify(stateToSave),
      });
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
              isMobile={isMobile}
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
            <div className="flex items-center gap-2">
              <Legend>Seller Information</Legend>
            </div>
          </AccordionTrigger>
          <div className="px-4 pb-4">
            <SellerInformation
              control={control}
              errors={errors}
              setValue={setValue}
              invoiceData={invoiceData}
              isMobile={isMobile}
            />
          </div>
        </AccordionItem>

        {/* Buyer Information */}
        <AccordionItem
          value={ACCORDION_BUYER}
          className="rounded-lg border shadow"
          data-testid={`buyer-information-section`}
        >
          <AccordionTrigger className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Legend>Buyer Information</Legend>
            </div>
          </AccordionTrigger>
          <div className="px-4 pb-4">
            <BuyerInformation
              control={control}
              errors={errors}
              setValue={setValue}
              invoiceData={invoiceData}
              isMobile={isMobile}
            />
          </div>
        </AccordionItem>

        {/* Items and pricing */}
        <AccordionItem
          value={ACCORDION_ITEMS}
          className="rounded-lg border shadow"
          data-testid={`invoice-items-section`}
        >
          <AccordionTrigger className="px-4 py-3">
            <Legend>Items and pricing</Legend>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <InvoiceItems
              control={control}
              fields={fields}
              handleRemoveInvoiceItem={handleRemoveInvoiceItem}
              errors={errors}
              currency={currency}
              language={language}
              append={append}
              template={template}
              taxLabelText={taxLabelText}
              invoiceData={invoiceData}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Final section */}
      <div className="space-y-4" data-testid={`final-section`}>
        <div className="">
          {/* Total field (with currency) (calculated automatically - read only field in the UI) */}
          <div className="mt-5" />
          <Label htmlFor={`total`} className="mb-1">
            Total
          </Label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <Controller
              name="total"
              control={control}
              render={({ field }) => {
                return (
                  <ReadOnlyMoneyInput
                    {...field}
                    id={`total`}
                    currency={currency}
                    value={field.value.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  />
                );
              }}
            />
          </div>
          {errors.total ? (
            <ErrorMessage>{errors.total.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Calculated automatically as the sum of each line item&apos;s
              pre-tax amount (Net Amount + VAT Amount)
            </InputHelperMessage>
          )}
        </div>

        {/* Payment Method (Only show for default template) */}
        {template === "default" ? (
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
                  render={({ field: { value, onChange, ...field } }) => {
                    return (
                      <Switch
                        {...field}
                        id={`paymentMethodFieldIsVisible`}
                        checked={value}
                        onCheckedChange={onChange}
                        className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                        data-testid="paymentMethodFieldIsVisible"
                      />
                    );
                  }}
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
              render={({ field }) => {
                return (
                  <Input
                    {...field}
                    id={`paymentMethod`}
                    type="text"
                    className="mt-1"
                  />
                );
              }}
            />
            {errors.paymentMethod ? (
              <ErrorMessage>{errors.paymentMethod.message}</ErrorMessage>
            ) : null}
          </div>
        ) : null}

        {/* Payment Due */}
        <div>
          <div className="mb-6">
            <Label htmlFor={`paymentDue`} className="mb-1">
              Payment Due
            </Label>
            <Controller
              name="paymentDue"
              control={control}
              render={({ field }) => {
                return (
                  <Input
                    {...field}
                    id={`paymentDue`}
                    type="date"
                    className=""
                  />
                );
              }}
            />
            {errors.paymentDue ? (
              <ErrorMessage>{errors.paymentDue.message}</ErrorMessage>
            ) : null}
            {!errors.paymentDue &&
            isPaymentDueBeforeDateOfIssue &&
            dateOfIssue ? (
              <InputHelperMessage>
                <span className="flex items-center text-balance text-amber-800">
                  <AlertIcon />
                  Payment due date is before date of issue (
                  {formattedDateOfIssue})
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
                    Set payment due date to {formattedSuggestedPaymentDue} (14
                    days from issue date)
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
                    Set payment due date to {formattedSuggestedPaymentDue} (14
                    days from issue date)
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
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Switch
                      {...field}
                      id={`notesFieldIsVisible`}
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                    />
                  );
                }}
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
            render={({ field }) => {
              return (
                <Textarea
                  {...field}
                  id={`notes`}
                  rows={3}
                  className=""
                  data-testid="notes"
                />
              );
            }}
          />
          {errors?.notes ? (
            <ErrorMessage>{errors?.notes?.message}</ErrorMessage>
          ) : null}
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
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Switch
                      {...field}
                      id={`qrCodeIsVisible`}
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      aria-label="Show QR Code in PDF"
                    />
                  );
                }}
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
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      id={`qrCodeData`}
                      type="text"
                      placeholder="Enter URL or text to encode"
                      data-testid="qrCodeData"
                    />
                  );
                }}
              />
              <InputHelperMessage>
                Enter any text or URL to generate a QR code. The QR code will
                appear in the bottom section of the invoice PDF.
              </InputHelperMessage>
              {errors.qrCodeData ? (
                <ErrorMessage>{errors.qrCodeData.message}</ErrorMessage>
              ) : null}
            </div>

            {/* QR Code Description */}
            <div>
              <Label htmlFor={`qrCodeDescription`} className="mb-2 block">
                Description (optional)
              </Label>
              <Controller
                name="qrCodeDescription"
                control={control}
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      id={`qrCodeDescription`}
                      type="text"
                      placeholder="Enter a description for the QR code"
                      data-testid="qrCodeDescription"
                    />
                  );
                }}
              />
              <InputHelperMessage>
                Optional text that will be displayed below the QR code in the
                PDF.
              </InputHelperMessage>
              {errors.qrCodeDescription ? (
                <ErrorMessage>{errors.qrCodeDescription.message}</ErrorMessage>
              ) : null}
            </div>
          </div>
        </fieldset>

        {/*
            Stripe template doesn't have these fields
        */}
        {invoiceData.template === "default" ? (
          <>
            <fieldset className="rounded-md border px-4 pb-4">
              <legend className="text-base font-semibold lg:text-lg">
                Person Authorized to Receive
              </legend>

              <div className="mb-2 mt-2 flex items-center justify-end">
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="personAuthorizedToReceiveFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Switch
                          {...field}
                          id="personAuthorizedToReceiveFieldIsVisible"
                          checked={value}
                          onCheckedChange={onChange}
                          className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          aria-label="Show Person Authorized to Receive in PDF"
                        />
                      );
                    }}
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
                  render={({ field }) => {
                    return (
                      <Input
                        {...field}
                        id="personAuthorizedToReceiveName"
                        type="text"
                        placeholder="Enter name of person authorized to receive"
                        data-testid="personAuthorizedToReceiveName"
                      />
                    );
                  }}
                />
                <InputHelperMessage>
                  Name displayed above the signature line in the PDF.
                </InputHelperMessage>
                {errors.personAuthorizedToReceiveName ? (
                  <ErrorMessage>
                    {errors.personAuthorizedToReceiveName.message}
                  </ErrorMessage>
                ) : null}
              </div>
            </fieldset>

            <fieldset className="rounded-md border px-4 pb-4">
              <legend className="text-base font-semibold lg:text-lg">
                Person Authorized to Issue
              </legend>

              <div className="mb-2 mt-2 flex items-center justify-end">
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="personAuthorizedToIssueFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Switch
                          {...field}
                          id="personAuthorizedToIssueFieldIsVisible"
                          checked={value}
                          onCheckedChange={onChange}
                          className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                          aria-label="Show Person Authorized to Issue in PDF"
                        />
                      );
                    }}
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
                  render={({ field }) => {
                    return (
                      <Input
                        {...field}
                        id="personAuthorizedToIssueName"
                        type="text"
                        placeholder="Enter name of person authorized to issue"
                        data-testid="personAuthorizedToIssueName"
                      />
                    );
                  }}
                />
                <InputHelperMessage>
                  Name displayed above the signature line in the PDF.
                </InputHelperMessage>
                {errors.personAuthorizedToIssueName ? (
                  <ErrorMessage>
                    {errors.personAuthorizedToIssueName.message}
                  </ErrorMessage>
                ) : null}
              </div>
            </fieldset>
          </>
        ) : null}
      </div>
    </form>
  );
});
