import dayjs from "dayjs";
import { InfoIcon, Upload, X } from "lucide-react";
import { memo, useCallback, useRef } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";

import {
  AlertIcon,
  ErrorMessage,
  inputErrorClassName,
} from "@/app/(app)/components/invoice-form/common";
import {
  getDefaultInvoiceNumberLabel,
  INVOICE_PDF_TRANSLATIONS,
} from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { formatTodayWithLocale } from "@/app/(app)/utils/format-date-with-locale";
import {
  getCurrentMonthAndYear,
  isServicePeriodStartInCurrentMonth,
} from "@/app/(app)/utils/format-service-period";
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
import { ButtonHelper } from "@/components/ui/button-helper";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { convertFileToBase64, validateImageSize } from "../utils/logo-upload";
import { StaleDatesBanner } from "./components/stale-dates-banner";

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

  const servicePeriodLabelText = useWatch({
    control,
    name: "servicePeriodLabelText",
  });

  const dateOfServiceLabelText = useWatch({
    control,
    name: "dateOfServiceLabelText",
  });

  const dateOfService = useWatch({ control, name: "dateOfService" });
  const dateOfServiceStart = useWatch({ control, name: "dateOfServiceStart" });
  const language = useWatch({ control, name: "language" });
  const template = useWatch({ control, name: "template" });
  const logo = useWatch({ control, name: "logo" });
  const selectedDateFormat = useWatch({ control, name: "dateFormat" });
  const paymentDue = useWatch({ control, name: "paymentDue" });

  const t = INVOICE_PDF_TRANSLATIONS[language];
  const defaultInvoiceNumberLabel = getDefaultInvoiceNumberLabel(
    language,
    template,
  );
  const defaultServicePeriodLabel = t.servicePeriod;
  const defaultDateOfServiceLabel = t.dateOfService;

  const isDefaultServicePeriodLabel =
    servicePeriodLabelText === defaultServicePeriodLabel;

  const isDefaultDateOfServiceLabel =
    dateOfServiceLabelText === defaultDateOfServiceLabel;

  const isDateOfIssueNotToday = !dayjs(dateOfIssue).isSame(dayjs(), "day");

  const isDateOfServiceEndOfMonth = dayjs(dateOfService).isSame(
    dayjs().endOf("month"),
    "day",
  );

  const isServicePeriodStartOutsideCurrentMonth =
    !!dateOfServiceStart &&
    !isServicePeriodStartInCurrentMonth(dateOfServiceStart);

  const isDefaultInvoiceNumberLabel =
    invoiceNumberLabel === defaultInvoiceNumberLabel;

  // extract the month and year from the invoice number (i.e. 1/04-2025 -> 04-2025)
  const extractInvoiceMonthAndYear = /(\d{2}-\d{4})/.exec(
    invoiceNumberValue ?? "",
  )?.[1];

  const isInvoiceNumberInCurrentMonth =
    extractInvoiceMonthAndYear === getCurrentMonthAndYear();

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

  /**
   * Whether to show Stale Dates Banner.
   * Banner appears when any invoice date/number is out of sync with current month.
   * Triggers: service end not end of current month, service start not in current month,
   * invoice number not for current month, issue date not today, payment due not 14 days after issue.
   */
  const canShowStaleDatesBanner =
    !isDateOfServiceEndOfMonth ||
    isServicePeriodStartOutsideCurrentMonth ||
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
            render={({ field }) => {
              return (
                <SelectNative
                  {...field}
                  id={`template`}
                  className={cn(
                    "block",
                    inputErrorClassName(!!errors.template),
                  )}
                  onChange={(e) => {
                    const newTemplate =
                      e.target.value === "stripe" ? "stripe" : "default";

                    field.onChange(e);

                    // When the user changes the invoice template, automatically update the invoice number label
                    // so it matches the default convention for the selected template and current language.
                    setValue(
                      "invoiceNumberObject.label",
                      getDefaultInvoiceNumberLabel(language, newTemplate),
                    );

                    // Handles template-specific form updates for better UX

                    if (newTemplate === "stripe") {
                      // Set date format to "MMMM D, YYYY" when template is Stripe
                      setValue("dateFormat", STRIPE_DEFAULT_DATE_FORMAT);

                      // Set unit field to be HIDDEN by default for Stripe template (matches stripe template behaviour)
                      setValue("items.0.unitFieldIsVisible", false);

                      // Set service period field to be VISIBLE for Stripe template (for backwards compatibility)
                      setValue("servicePeriodFieldIsVisible", true);
                    } else if (newTemplate === "default") {
                      // Clear Stripe-specific fields when not using Stripe template
                      if (errors.stripePayOnlineUrl) {
                        setValue("stripePayOnlineUrl", "");
                      }

                      // Set date format to "YYYY-MM-DD" when template is default
                      setValue("dateFormat", DEFAULT_DATE_FORMAT);

                      // Set unit field to be VISIBLE for default template
                      setValue("items.0.unitFieldIsVisible", true);

                      // Set service period field to be HIDDEN for default template (matches the default template behaviour)
                      setValue("servicePeriodFieldIsVisible", false);
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
              );
            }}
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
            render={({ field }) => {
              return (
                <SelectNative
                  {...field}
                  id={`language`}
                  className={cn(
                    "block",
                    inputErrorClassName(!!errors.language),
                  )}
                  onChange={(e) => {
                    field.onChange(e);

                    // IMPORTANT: for BETTER USER EXPERIENCE, when switching language, we update the invoice number and labels to the new language

                    // Update INVOICE NUMBER and LABELS when language changes
                    const newLanguage = e.target
                      .value as keyof typeof INVOICE_PDF_TRANSLATIONS;

                    // we need to keep the invoice number suffix (e.g. 1/MM-YYYY) for better user experience, when switching language
                    setValue(
                      "invoiceNumberObject.label",
                      getDefaultInvoiceNumberLabel(newLanguage, template),
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
                      INVOICE_PDF_TRANSLATIONS[newLanguage].invoiceItemsTable
                        .vat;

                    // Update TAX LABEL TEXT (VAT/GST/etc.) when language changes
                    // This ensures the tax column header in the invoice items table
                    // displays the correct translation for the selected language
                    setValue("taxLabelText", newTranslation);

                    setValue(
                      "servicePeriodLabelText",
                      INVOICE_PDF_TRANSLATIONS[newLanguage].servicePeriod,
                    );
                    setValue(
                      "dateOfServiceLabelText",
                      INVOICE_PDF_TRANSLATIONS[newLanguage].dateOfService,
                    );
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
              );
            }}
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
            render={({ field }) => {
              return (
                <CurrencyCombobox
                  id={`currency`}
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!errors.currency}
                />
              );
            }}
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
            render={({ field }) => {
              return (
                <SelectNative
                  {...field}
                  id={`dateFormat`}
                  className={cn(
                    "block",
                    inputErrorClassName(!!errors.dateFormat),
                  )}
                >
                  {SUPPORTED_DATE_FORMATS.map((format) => {
                    const preview = formatTodayWithLocale({
                      selectedDateFormat: format,
                      language,
                    });
                    const isDefault = format === DEFAULT_DATE_FORMAT;

                    return (
                      <option key={format} value={format}>
                        {format} ({preview}) {isDefault ? "(default)" : ""}
                      </option>
                    );
                  })}
                </SelectNative>
              );
            }}
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
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      type="text"
                      id="invoiceNumberLabel"
                      placeholder="Enter invoice number label"
                      className={cn(
                        "mt-1 block w-full",
                        inputErrorClassName(
                          !!errors.invoiceNumberObject?.label,
                        ),
                      )}
                    />
                  );
                }}
              />
              {errors.invoiceNumberObject?.label ? (
                <ErrorMessage>
                  {errors.invoiceNumberObject.label.message}
                </ErrorMessage>
              ) : null}
              {!isDefaultInvoiceNumberLabel &&
              !errors.invoiceNumberObject?.label ? (
                <InputHelperMessage>
                  <ButtonHelper
                    onClick={() => {
                      setValue(
                        "invoiceNumberObject.label",
                        defaultInvoiceNumberLabel,
                      );
                    }}
                  >
                    Reset to default (&quot;{defaultInvoiceNumberLabel}&quot;)
                  </ButtonHelper>
                </InputHelperMessage>
              ) : null}
            </div>

            <div>
              <Label htmlFor="invoiceNumberValue">Value</Label>
              <Controller
                name="invoiceNumberObject.value"
                control={control}
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      type="text"
                      id="invoiceNumberValue"
                      placeholder="Enter invoice number value"
                      className={cn(
                        "mt-1 block w-full",
                        inputErrorClassName(
                          !!errors.invoiceNumberObject?.value,
                        ),
                      )}
                    />
                  );
                }}
              />
              {errors.invoiceNumberObject?.value ? (
                <ErrorMessage>
                  {errors.invoiceNumberObject.value.message}
                </ErrorMessage>
              ) : null}

              {!isInvoiceNumberInCurrentMonth &&
              !errors.invoiceNumberObject?.value ? (
                <InputHelperMessage>
                  <span className="flex items-center text-amber-800">
                    <AlertIcon />
                    Invoice number does not match current month
                  </span>
                </InputHelperMessage>
              ) : null}
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
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  type="date"
                  id={`dateOfIssue`}
                  className={inputErrorClassName(!!errors.dateOfIssue)}
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
              );
            }}
          />
          {errors.dateOfIssue ? (
            <ErrorMessage>{errors.dateOfIssue.message}</ErrorMessage>
          ) : null}
          {isDateOfIssueNotToday && !errors.dateOfIssue ? (
            <InputHelperMessage>
              <span className="flex items-center text-amber-800">
                <AlertIcon />
                Date of issue is not today
              </span>
              <ButtonHelper
                onClick={() => {
                  const today = dayjs().format("YYYY-MM-DD");

                  setValue("dateOfIssue", today);
                  setValue(
                    "paymentDue",
                    dayjs(today).add(14, "days").format("YYYY-MM-DD"),
                  );
                }}
              >
                <span className="text-pretty">
                  Set date of issue to today (
                  {formatTodayWithLocale({ selectedDateFormat, language })})
                </span>
              </ButtonHelper>
            </InputHelperMessage>
          ) : null}
        </div>

        <fieldset className="rounded-md border p-4">
          <legend className="px-1 text-lg font-semibold text-gray-900">
            Service period
          </legend>

          {/** Service period PDF visibility toggle */}
          <div className="mb-5 flex flex-col items-start gap-2 sm:justify-end sm:gap-4">
            <div className="inline-flex items-center gap-2">
              <Controller
                name="servicePeriodFieldIsVisible"
                control={control}
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Switch
                      {...field}
                      id="servicePeriodFieldIsVisible"
                      data-testid="servicePeriodFieldIsVisible"
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      aria-label='Show the "Service period" (Service period start and end) field in the PDF'
                    />
                  );
                }}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor="servicePeriodFieldIsVisible">
                    Show &quot;Service period&quot; in PDF
                  </Label>
                }
                content='Show the "Service period" (Service period start and end) field in the PDF'
              />
            </div>
          </div>

          {/** Service period start and end inputs */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="dateOfServiceStart" className="mb-1">
                Service period start
              </Label>
              <Controller
                name="dateOfServiceStart"
                control={control}
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      type="date"
                      id="dateOfServiceStart"
                      className={inputErrorClassName(
                        !!errors.dateOfServiceStart,
                      )}
                    />
                  );
                }}
              />
              {errors.dateOfServiceStart ? (
                <ErrorMessage>{errors.dateOfServiceStart.message}</ErrorMessage>
              ) : null}

              {isServicePeriodStartOutsideCurrentMonth &&
              !errors.dateOfServiceStart ? (
                <InputHelperMessage>
                  <span className="flex items-center text-amber-800">
                    <AlertIcon />
                    Service period start is not in the current month
                  </span>
                </InputHelperMessage>
              ) : null}
            </div>

            <div>
              <div className="mb-1 flex items-center">
                <Label htmlFor="dateOfService">Service period end</Label>
                <CustomTooltip
                  content='Shown on PDF as part of "Service period" and as "Date of sales/of executing the service"'
                  side="top"
                  popoverOnMobile
                  trigger={
                    <button
                      type="button"
                      className="ml-1 inline-flex cursor-pointer items-center align-middle"
                      aria-label='Shown on PDF as part of "Service period" and as "Date of sales/of executing the service"'
                    >
                      <InfoIcon
                        className="size-3"
                        aria-hidden
                        data-testid="service-period-end-info-icon"
                      />
                    </button>
                  }
                />
              </div>

              <Controller
                name="dateOfService"
                control={control}
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      type="date"
                      id="dateOfService"
                      className={inputErrorClassName(!!errors.dateOfService)}
                    />
                  );
                }}
              />
              {errors.dateOfService ? (
                <ErrorMessage>{errors.dateOfService.message}</ErrorMessage>
              ) : null}

              {!isDateOfServiceEndOfMonth && !errors.dateOfService ? (
                <InputHelperMessage>
                  <span className="flex items-center text-amber-800">
                    <AlertIcon />
                    Service period end is not the last day of the current month
                  </span>
                </InputHelperMessage>
              ) : null}
            </div>
          </div>

          {/** Service period PDF label customization - default template only */}
          {template === "default" ? (
            <div className="mt-5 space-y-5">
              <div>
                <Label htmlFor="servicePeriodLabelText">
                  Service period PDF label
                </Label>
                <Controller
                  name="servicePeriodLabelText"
                  control={control}
                  render={({ field }) => {
                    return (
                      <Textarea
                        {...field}
                        id="servicePeriodLabelText"
                        rows={2}
                        placeholder="Enter service period PDF label"
                        className={cn(
                          "mt-1 block w-full",
                          inputErrorClassName(!!errors.servicePeriodLabelText),
                        )}
                      />
                    );
                  }}
                />
                {errors.servicePeriodLabelText ? (
                  <ErrorMessage>
                    {errors.servicePeriodLabelText.message}
                  </ErrorMessage>
                ) : null}
                {!isDefaultServicePeriodLabel ? (
                  <InputHelperMessage>
                    <ButtonHelper
                      onClick={() => {
                        setValue(
                          "servicePeriodLabelText",
                          defaultServicePeriodLabel,
                        );
                      }}
                    >
                      Reset to default (&quot;{defaultServicePeriodLabel}&quot;)
                    </ButtonHelper>
                  </InputHelperMessage>
                ) : null}
              </div>

              <div>
                <div className="relative mb-2 flex items-center justify-between">
                  <Label htmlFor="dateOfServiceLabelText">
                    Date of sales PDF label
                  </Label>
                  <div className="inline-flex items-center gap-2">
                    <Controller
                      name="dateOfServiceFieldIsVisible"
                      control={control}
                      render={({ field: { value, onChange, ...field } }) => {
                        return (
                          <Switch
                            {...field}
                            id="dateOfServiceFieldIsVisible"
                            data-testid="dateOfServiceFieldIsVisible"
                            checked={value}
                            onCheckedChange={onChange}
                            className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                            aria-label='Show the "Date of sales/of executing the service" field in the PDF'
                          />
                        );
                      }}
                    />
                    <CustomTooltip
                      trigger={
                        <Label htmlFor="dateOfServiceFieldIsVisible">
                          Show in PDF
                        </Label>
                      }
                      content='Show the "Date of sales/of executing the service" field in the PDF'
                    />
                  </div>
                </div>
                <Controller
                  name="dateOfServiceLabelText"
                  control={control}
                  render={({ field }) => {
                    return (
                      <Textarea
                        {...field}
                        id="dateOfServiceLabelText"
                        rows={2}
                        placeholder="Enter date of sales (Service period end) PDF label"
                        className={cn(
                          "block w-full",
                          inputErrorClassName(!!errors.dateOfServiceLabelText),
                        )}
                      />
                    );
                  }}
                />
                {errors.dateOfServiceLabelText ? (
                  <ErrorMessage>
                    {errors.dateOfServiceLabelText.message}
                  </ErrorMessage>
                ) : null}
                {!isDefaultDateOfServiceLabel ? (
                  <InputHelperMessage>
                    <ButtonHelper
                      onClick={() => {
                        setValue(
                          "dateOfServiceLabelText",
                          defaultDateOfServiceLabel,
                        );
                      }}
                    >
                      Reset to default (&quot;{defaultDateOfServiceLabel}&quot;)
                    </ButtonHelper>
                  </InputHelperMessage>
                ) : null}
              </div>
            </div>
          ) : null}
        </fieldset>

        {/* Out of Date Dates Helper */}
        {canShowStaleDatesBanner ? (
          <StaleDatesBanner
            dateOfIssue={dateOfIssue}
            dateOfService={dateOfService}
            dateOfServiceStart={dateOfServiceStart ?? ""}
            invoiceNumberValue={invoiceNumberValue ?? ""}
            paymentDue={paymentDue ?? ""}
            selectedDateFormat={selectedDateFormat ?? DEFAULT_DATE_FORMAT}
            language={language}
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
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Switch
                      {...field}
                      id={`invoiceTypeFieldIsVisible`}
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      aria-label={`Show the "Header Notes" Field in the PDF`}
                    />
                  );
                }}
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
            render={({ field }) => {
              return (
                <Textarea
                  {...field}
                  id={`invoiceType`}
                  rows={2}
                  className={inputErrorClassName(!!errors.invoiceType)}
                  placeholder="Enter header notes"
                />
              );
            }}
          />
          {errors.invoiceType ? (
            <ErrorMessage>{errors.invoiceType.message}</ErrorMessage>
          ) : null}
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
        {template === "stripe" ? (
          <div className="">
            <Label htmlFor={`stripePayOnlineUrl`} className="">
              Payment Link URL
            </Label>

            <Controller
              name="stripePayOnlineUrl"
              control={control}
              render={({ field }) => {
                return (
                  <Input
                    {...field}
                    id={`stripePayOnlineUrl`}
                    type="url"
                    className={cn(
                      "mt-1",
                      inputErrorClassName(!!errors.stripePayOnlineUrl),
                    )}
                  />
                );
              }}
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
        ) : null}
      </div>
    </div>
  );
});
