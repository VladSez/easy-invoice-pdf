import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import {
  DEFAULT_DATE_FORMAT,
  type InvoiceData,
  LANGUAGE_TO_LABEL,
  STRIPE_DEFAULT_DATE_FORMAT,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_LANGUAGES,
  SUPPORTED_TEMPLATES,
  TEMPLATE_TO_LABEL,
} from "@/app/schema";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { Button } from "@/components/ui/button";
import { ButtonHelper } from "@/components/ui/button-helper";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import dayjs from "dayjs";
import { AlertTriangle, RefreshCw, Upload, X } from "lucide-react";
import { memo, useCallback, useRef } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";

const AlertIcon = () => {
  return (
    <AlertTriangle className="mr-1 inline-block size-3.5 shrink-0 text-amber-500" />
  );
};

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

const CURRENT_MONTH_AND_YEAR = dayjs().format("MM-YYYY");

// Logo helper functions
const validateImageSize = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes

    resolve(file.size <= maxSize);
  });
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface GeneralInformationProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  dateOfIssue: string;
  isMobile: boolean;
}

export const GeneralInformation = memo(function GeneralInformation({
  control,
  errors,
  setValue,
  dateOfIssue,
  isMobile,
}: GeneralInformationProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invoiceNumberLabel = useWatch({
    control,
    name: "invoiceNumberObject.label",
  });

  const invoiceNumberValue = useWatch({
    control,
    name: "invoiceNumberObject.value",
  });

  const dateOfService = useWatch({ control, name: "dateOfService" });
  const language = useWatch({ control, name: "language" });
  const template = useWatch({ control, name: "template" });
  const logo = useWatch({ control, name: "logo" });
  const selectedDateFormat = useWatch({ control, name: "dateFormat" });
  const paymentDue = useWatch({ control, name: "paymentDue" });

  const t = INVOICE_PDF_TRANSLATIONS[language];
  const defaultInvoiceNumber = `${t.invoiceNumber}:`;

  const isDateOfIssueNotToday = !dayjs(dateOfIssue).isSame(dayjs(), "day");

  const isDateOfServiceEqualsEndOfCurrentMonth = dayjs(dateOfService).isSame(
    dayjs().endOf("month"),
    "day",
  );

  const isDefaultInvoiceNumberLabel =
    invoiceNumberLabel === defaultInvoiceNumber;

  // extract the month and year from the invoice number (i.e. 1/04-2025 -> 04-2025)
  const extractInvoiceMonthAndYear = /(\d{2}-\d{4})/.exec(
    invoiceNumberValue ?? "",
  )?.[1];

  const isInvoiceNumberInCurrentMonth =
    extractInvoiceMonthAndYear === CURRENT_MONTH_AND_YEAR;

  // Logo upload handlers
  const handleLogoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG or WebP)");
        return;
      }

      // Validate file size (3MB max)
      const isValidSize = await validateImageSize(file);
      if (!isValidSize) {
        toast.error("Image size must be less than 3MB");
        return;
      }

      try {
        const base64 = await convertFileToBase64(file);
        setValue("logo", base64);
        toast.success("Logo uploaded successfully!", {
          id: "logo-uploaded-success-toast",
          closeButton: true,
          richColors: true,
          position: isMobile ? "top-center" : "bottom-right",
        });
      } catch (error) {
        console.error("Error converting file to base64:", error);
        toast.error("Error uploading image", {
          description: "Please try again",
          closeButton: true,
          richColors: true,
          position: isMobile ? "top-center" : "bottom-right",
        });
      }
    },
    [isMobile, setValue],
  );

  const handleLogoRemove = useCallback(() => {
    setValue("logo", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Logo removed successfully!", {
      id: "logo-removed-success-toast",
      closeButton: true,
      richColors: true,
      position: isMobile ? "top-center" : "bottom-right",
    });
  }, [isMobile, setValue]);

  const isPaymentDueNotMatchingIssueDate =
    !paymentDue ||
    !dayjs(paymentDue).isSame(dayjs(dateOfIssue).add(14, "days"), "day");

  const canShowOutOfDateDatesHelper =
    !isDateOfServiceEqualsEndOfCurrentMonth ||
    !isInvoiceNumberInCurrentMonth ||
    isDateOfIssueNotToday ||
    isPaymentDueNotMatchingIssueDate;

  return (
    <div>
      <div className="space-y-4">
        {/* Invoice Template Selection */}
        <div>
          <Label htmlFor={`template`} className="mb-1">
            Invoice Template
          </Label>
          <Controller
            name="template"
            control={control}
            render={({ field }) => (
              <SelectNative
                {...field}
                id={`template`}
                className="block"
                onChange={(e) => {
                  field.onChange(e);

                  const newTemplate = e.target.value;

                  // Handles template-specific form updates for better UX

                  if (newTemplate === "stripe") {
                    // Set date format to "MMMM D, YYYY" when template is Stripe
                    setValue("dateFormat", STRIPE_DEFAULT_DATE_FORMAT);

                    // Set unit field to be HIDDEN by default for Stripe template (matches stripe template behaviour)
                    setValue("items.0.unitFieldIsVisible", false);
                  } else {
                    // DEFAULT TEMPLATE

                    // Clear Stripe-specific fields when not using Stripe template
                    if (errors.stripePayOnlineUrl) {
                      setValue("stripePayOnlineUrl", "");
                    }

                    // Set date format to "YYYY-MM-DD" when template is default
                    setValue("dateFormat", DEFAULT_DATE_FORMAT);

                    // Set unit field to be VISIBLE for default template
                    setValue("items.0.unitFieldIsVisible", true);
                  }
                }}
              >
                {SUPPORTED_TEMPLATES.map((template) => {
                  const templateLabel = TEMPLATE_TO_LABEL[template];

                  return (
                    <option key={template} value={template}>
                      {templateLabel}
                    </option>
                  );
                })}
              </SelectNative>
            )}
          />
          {errors.template ? (
            <ErrorMessage>{errors.template.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Select the design template for your invoice
            </InputHelperMessage>
          )}
        </div>

        {/* Language PDF Select */}
        <div>
          <Label htmlFor={`language`} className="mb-1">
            Invoice PDF Language
          </Label>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <SelectNative
                {...field}
                id={`language`}
                className="block"
                onChange={(e) => {
                  field.onChange(e);

                  // IMPORTANT: for BETTER USER EXPERIENCE, when switching language, we update the invoice number and labels to the new language

                  // Update INVOICE NUMBER and LABELS when language changes
                  const newLanguage = e.target
                    .value as keyof typeof INVOICE_PDF_TRANSLATIONS;

                  const newInvoiceNumberLabel =
                    INVOICE_PDF_TRANSLATIONS[newLanguage].invoiceNumber;

                  // we need to keep the invoice number suffix (e.g. 1/MM-YYYY) for better user experience, when switching language
                  setValue(
                    "invoiceNumberObject.label",
                    `${newInvoiceNumberLabel}:`,
                  );
                  setValue("invoiceNumberObject.value", invoiceNumberValue);

                  // Update SELLER VAT NO (Account Number) LABEL TEXT when language changes
                  setValue(
                    "seller.vatNoLabelText",
                    INVOICE_PDF_TRANSLATIONS[newLanguage].seller.vatNo,
                  );

                  // Update BUYER VAT NO (Account Number) LABEL TEXT when language changes
                  setValue(
                    "buyer.vatNoLabelText",
                    INVOICE_PDF_TRANSLATIONS[newLanguage].buyer.vatNo,
                  );

                  const newTranslation =
                    INVOICE_PDF_TRANSLATIONS[newLanguage].invoiceItemsTable.vat;

                  // Update TAX LABEL TEXT (VAT/GST/etc.) when language changes
                  // This ensures the tax column header in the invoice items table
                  // displays the correct translation for the selected language
                  setValue("taxLabelText", newTranslation);
                }}
              >
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const languageName = LANGUAGE_TO_LABEL[lang];

                  if (!languageName) {
                    return null;
                  }

                  return (
                    <option key={lang} value={lang}>
                      {languageName}
                    </option>
                  );
                })}
              </SelectNative>
            )}
          />
          {errors.language ? (
            <ErrorMessage>{errors.language.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Select the language of the invoice
            </InputHelperMessage>
          )}
        </div>

        {/* Currency Select */}
        <div>
          <Label htmlFor={`currency`} className="mb-1">
            Currency
          </Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <CurrencyCombobox
                id={`currency`}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.currency ? (
            <ErrorMessage>{errors.currency.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Select the currency of the invoice
            </InputHelperMessage>
          )}
        </div>

        {/* Date Format */}
        <div>
          <Label htmlFor={`dateFormat`} className="mb-1">
            Date Format
          </Label>
          <Controller
            name="dateFormat"
            control={control}
            render={({ field }) => (
              <SelectNative {...field} id={`dateFormat`} className="block">
                {SUPPORTED_DATE_FORMATS.map((format) => {
                  const preview = dayjs().locale(language).format(format);
                  const isDefault = format === DEFAULT_DATE_FORMAT;

                  return (
                    <option key={format} value={format}>
                      {format} ({preview}) {isDefault ? "(default)" : ""}
                    </option>
                  );
                })}
              </SelectNative>
            )}
          />

          {errors.dateFormat ? (
            <ErrorMessage>{errors.dateFormat.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Select the date format of the invoice
            </InputHelperMessage>
          )}
        </div>

        {/* Invoice Number */}
        <fieldset className="rounded-md border p-4">
          <legend className="px-1 text-lg font-semibold text-gray-900">
            Invoice Number
          </legend>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumberLabel">Label</Label>
              <Controller
                name="invoiceNumberObject.label"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    id="invoiceNumberLabel"
                    placeholder="Enter invoice number label"
                    className="mt-1 block w-full"
                  />
                )}
              />
              {errors.invoiceNumberObject?.label && (
                <ErrorMessage>
                  {errors.invoiceNumberObject.label.message}
                </ErrorMessage>
              )}
              {!isDefaultInvoiceNumberLabel &&
                !errors.invoiceNumberObject?.label && (
                  <InputHelperMessage>
                    <ButtonHelper
                      onClick={() => {
                        setValue(
                          "invoiceNumberObject.label",
                          defaultInvoiceNumber,
                        );
                      }}
                    >
                      Switch to default label (&quot;{defaultInvoiceNumber}
                      &quot;)
                    </ButtonHelper>
                  </InputHelperMessage>
                )}
            </div>

            <div>
              <Label htmlFor="invoiceNumberValue">Value</Label>
              <Controller
                name="invoiceNumberObject.value"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    id="invoiceNumberValue"
                    placeholder="Enter invoice number value"
                    className="mt-1 block w-full"
                  />
                )}
              />
              {errors.invoiceNumberObject?.value && (
                <ErrorMessage>
                  {errors.invoiceNumberObject.value.message}
                </ErrorMessage>
              )}

              {!isInvoiceNumberInCurrentMonth &&
                !errors.invoiceNumberObject?.value && (
                  <InputHelperMessage>
                    <span className="flex items-center text-amber-800">
                      <AlertIcon />
                      Invoice number does not match current month
                    </span>

                    <ButtonHelper
                      onClick={() => {
                        setValue(
                          "invoiceNumberObject.value",
                          `1/${CURRENT_MONTH_AND_YEAR}`,
                        );
                      }}
                    >
                      <span className="text-pretty">
                        Set invoice number to{" "}
                        <span className="font-bold">
                          current month ({`1/${CURRENT_MONTH_AND_YEAR}`})
                        </span>
                      </span>
                    </ButtonHelper>
                  </InputHelperMessage>
                )}
            </div>
          </div>
        </fieldset>

        {/* Date of Issue */}
        <div>
          <Label htmlFor={`dateOfIssue`} className="mb-1">
            Date of Issue
          </Label>
          <Controller
            name="dateOfIssue"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                id={`dateOfIssue`}
                className=""
                onChange={(e) => {
                  field.onChange(e);

                  const newDate = e.target.value;

                  // Automatically update payment due date to 14 days after the new date of issue for better UX
                  if (newDate) {
                    setValue(
                      "paymentDue",
                      dayjs(newDate).add(14, "days").format("YYYY-MM-DD"),
                    );
                  }
                }}
              />
            )}
          />
          {errors.dateOfIssue && (
            <ErrorMessage>{errors.dateOfIssue.message}</ErrorMessage>
          )}
          {isDateOfIssueNotToday && !errors.dateOfIssue ? (
            <InputHelperMessage>
              <span className="flex items-center text-amber-800">
                <AlertIcon />
                Date of issue is not today
              </span>

              <ButtonHelper
                onClick={() => {
                  const currentMonth = dayjs().format("YYYY-MM-DD"); // default browser date input format is YYYY-MM-DD

                  setValue("dateOfIssue", currentMonth);

                  // Automatically update payment due date to 14 days after the new date of issue for better UX
                  setValue(
                    "paymentDue",
                    dayjs(currentMonth).add(14, "days").format("YYYY-MM-DD"),
                  );
                }}
              >
                <span className="text-pretty">
                  Set date of issue to{" "}
                  <span className="font-bold">
                    today ({dayjs().format(selectedDateFormat)})
                  </span>{" "}
                  and update payment due to{" "}
                  <span className="font-bold">
                    +14 days (
                    {dayjs().add(14, "days").format(selectedDateFormat)})
                  </span>
                </span>
              </ButtonHelper>
            </InputHelperMessage>
          ) : null}
        </div>

        {/* Date of Service */}
        <div>
          <Label htmlFor={`dateOfService`} className="mb-1">
            Date of Service
          </Label>
          <Controller
            name="dateOfService"
            control={control}
            render={({ field }) => (
              <Input {...field} type="date" id={`dateOfService`} className="" />
            )}
          />
          {errors.dateOfService && (
            <ErrorMessage>{errors.dateOfService.message}</ErrorMessage>
          )}

          {!isDateOfServiceEqualsEndOfCurrentMonth && !errors.dateOfService ? (
            <InputHelperMessage>
              <span className="flex items-center text-amber-800">
                <AlertIcon />
                Date of service is not the last day of the current month
              </span>

              <ButtonHelper
                onClick={() => {
                  const lastDayOfCurrentMonth = dayjs()
                    .endOf("month")
                    .format("YYYY-MM-DD"); // default browser date input format is YYYY-MM-DD

                  setValue("dateOfService", lastDayOfCurrentMonth);
                }}
              >
                <span className="text-pretty">
                  Set date of service to{" "}
                  <span className="font-bold">
                    month end (
                    {dayjs().endOf("month").format(selectedDateFormat)})
                  </span>
                </span>
              </ButtonHelper>
            </InputHelperMessage>
          ) : null}
        </div>

        {canShowOutOfDateDatesHelper ? (
          <OutOfDateDatesHelper
            dateOfIssue={dateOfIssue}
            dateOfService={dateOfService}
            invoiceNumberValue={invoiceNumberValue ?? ""}
            paymentDue={paymentDue ?? ""}
            selectedDateFormat={selectedDateFormat ?? DEFAULT_DATE_FORMAT}
            setValue={setValue}
            isMobile={isMobile}
          />
        ) : null}

        {/* Header Notes - Purpose is to add a custom text to the header of the invoice */}
        <div>
          <div className="relative mb-2 flex items-center justify-between">
            <Label htmlFor={`invoiceType`} className="">
              Header Notes
            </Label>

            {/* Show Header Notes field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`invoiceTypeFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`invoiceTypeFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                    aria-label={`Show the "Header Notes" Field in the PDF`}
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`invoiceTypeFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content='Show the "Header Notes" Field in the PDF'
              />
            </div>
          </div>

          <Controller
            name="invoiceType"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`invoiceType`}
                rows={2}
                className=""
                placeholder="Enter header notes"
              />
            )}
          />
          {errors.invoiceType && (
            <ErrorMessage>{errors.invoiceType.message}</ErrorMessage>
          )}
        </div>
        {/* Logo Upload */}
        <div className="">
          <Label htmlFor="logoUpload" className="mb-2">
            Company Logo
          </Label>

          {logo ? (
            <div className="space-y-2">
              {/* Logo preview */}
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt="Company logo preview"
                  className="h-28 max-w-40 rounded-lg border-2 border-gray-200 object-contain p-2 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Remove logo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <InputHelperMessage>
                Logo uploaded successfully. Click the X to remove it.
              </InputHelperMessage>
            </div>
          ) : (
            <div data-testid="logo-upload-input">
              <input
                ref={fileInputRef}
                type="file"
                id="logoUpload"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logoUpload"
                className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                <div className="text-center">
                  <Upload className="mx-auto h-4 w-4 text-gray-400" />
                  <p className="mt-3 text-sm font-medium text-gray-600">
                    Click to upload your company logo
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    JPEG, PNG or WebP (max 3MB)
                  </p>
                </div>
              </label>
            </div>
          )}

          {errors.logo ? (
            <ErrorMessage>{errors.logo.message}</ErrorMessage>
          ) : null}
        </div>

        {/* Pay Online URL - Only for Stripe template */}
        {template === "stripe" && (
          <div className="">
            <Label htmlFor={`stripePayOnlineUrl`} className="">
              Payment Link URL
            </Label>

            <Controller
              name="stripePayOnlineUrl"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`stripePayOnlineUrl`}
                  type="url"
                  className="mt-1"
                />
              )}
            />
            {errors.stripePayOnlineUrl ? (
              <ErrorMessage>{errors.stripePayOnlineUrl.message}</ErrorMessage>
            ) : (
              <InputHelperMessage>
                Enter your payment URL. This adds a &quot;Pay Online&quot;
                button to the PDF invoice.
              </InputHelperMessage>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

interface OutOfDateDatesHelperProps {
  dateOfIssue: string;
  dateOfService: string;
  invoiceNumberValue: string;
  paymentDue: string;
  selectedDateFormat: string;
  setValue: UseFormSetValue<InvoiceData>;
  isMobile: boolean;
}

/**
 * Displays a helper component that detects and allows updating stale invoice dates.
 *
 * This component checks if the invoice dates (date of issue, date of service, payment due)
 * and invoice number are outdated compared to the current date. If any are stale, it displays
 * a table showing the old vs new values and provides a button to update all dates at once.
 */
function OutOfDateDatesHelper({
  dateOfIssue,
  dateOfService,
  invoiceNumberValue,
  paymentDue,
  selectedDateFormat,
  setValue,
  isMobile,
}: OutOfDateDatesHelperProps) {
  const formatDate = (date: string) =>
    dayjs(date).locale("en").format(selectedDateFormat);

  const isDateOfIssueStale = !dayjs(dateOfIssue).isSame(dayjs(), "day");
  const isDateOfServiceStale = !dayjs(dateOfService).isSame(
    dayjs().endOf("month"),
    "day",
  );
  const extractedMonthYear = /(\d{2}-\d{4})/.exec(invoiceNumberValue)?.[1];
  const isInvoiceNumberStale = extractedMonthYear !== CURRENT_MONTH_AND_YEAR;

  /**
   * Checks if the payment due date is stale (outdated).
   * A payment due date is considered stale if:
   * - It's not set (empty/undefined), OR
   * - It doesn't match the expected date (14 days after the date of issue)
   */
  const isPaymentDueStale =
    !paymentDue ||
    !dayjs(paymentDue).isSame(dayjs(dateOfIssue).add(14, "days"), "day");

  const targetToday = dayjs().locale("en").format(selectedDateFormat);
  const targetEndOfMonth = dayjs()
    .locale("en")
    .endOf("month")
    .format(selectedDateFormat);
  const targetPaymentDue = dayjs()
    .locale("en")
    .add(14, "days")
    .format(selectedDateFormat);
  const targetInvoiceNumber = `1/${CURRENT_MONTH_AND_YEAR}`;

  const staleItems = [
    isDateOfIssueStale && {
      label: "Date of issue",
      oldValue: formatDate(dateOfIssue),
      newValue: targetToday,
      hint: "today",
    },
    isDateOfServiceStale && {
      label: "Date of service",
      oldValue: formatDate(dateOfService),
      newValue: targetEndOfMonth,
      hint: "end of month",
    },
    isInvoiceNumberStale && {
      label: "Invoice number",
      oldValue: invoiceNumberValue || "—",
      newValue: targetInvoiceNumber,
      hint: undefined,
    },
    isPaymentDueStale && {
      label: "Payment due",
      oldValue: paymentDue ? formatDate(paymentDue) : "—",
      newValue: targetPaymentDue,
      hint: "date of issue + 14 days",
    },
  ].filter(Boolean) as {
    label: string;
    oldValue: string;
    newValue: string;
    hint?: string;
  }[];

  return (
    <div
      className="rounded-md border border-amber-200 bg-amber-50/90 px-3 py-4 shadow-sm shadow-amber-200/50 duration-300 animate-in fade-in slide-in-from-bottom-2"
      role="region"
      aria-live="polite"
      data-testid="out-of-date-dates-helper"
    >
      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-amber-800">
        <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
        <span>
          {staleItems.length}{" "}
          {staleItems.length === 1 ? "field is" : "fields are"} out of date
        </span>
      </div>

      <table className="w-full border-collapse overflow-hidden rounded border border-amber-300 text-xs">
        <thead>
          <tr className="border-b border-amber-300 bg-amber-100/60 text-left text-amber-800">
            <th className="w-[65px] max-w-[65px] px-2.5 py-1.5 font-semibold">
              Field
            </th>
            <th className="px-2.5 py-1.5 font-semibold">Change</th>
          </tr>
        </thead>

        <tbody>
          {staleItems.map((item) => (
            <tr
              key={item.label}
              className="border-b border-amber-300 last:border-b-0"
            >
              <td className="w-[65px] max-w-[65px] px-2.5 py-1.5 text-amber-800">
                {item.label}
              </td>

              <td className="text-pretty px-2.5 py-1.5 pr-0">
                <span className="bg-red-100 text-amber-800 line-through decoration-amber-700/50">
                  {item.oldValue}
                </span>
                <span className="mx-1 text-amber-700">→</span>
                <span className="bg-green-200 font-semibold text-green-800">
                  {item.newValue}
                </span>
                {item.hint ? (
                  <span className="ml-1 font-normal text-green-700">
                    ({item.hint})
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button
        type="button"
        size="sm"
        className="mt-3.5 gap-1.5 bg-amber-600 text-white shadow-sm hover:bg-amber-600/95"
        onClick={() => {
          const today = dayjs().format("YYYY-MM-DD");

          const lastDayOfCurrentMonth = dayjs()
            .endOf("month")
            .format("YYYY-MM-DD");

          setValue("dateOfService", lastDayOfCurrentMonth);
          setValue("dateOfIssue", today);
          setValue("invoiceNumberObject.value", targetInvoiceNumber);

          const newPaymentDue = dayjs(today)
            .add(14, "days")
            .format("YYYY-MM-DD");

          setValue("paymentDue", newPaymentDue);

          toast.success("All dates updated successfully", {
            position: isMobile ? "top-center" : "bottom-right",
          });
        }}
      >
        <RefreshCw className="size-3.5" />
        Update All Dates
      </Button>
    </div>
  );
}
