import dayjs from "dayjs";
import { Upload, X } from "lucide-react";
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
  FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME,
  hiddenInPdfClassName,
  inputErrorClassName,
} from "@/app/(main)/(app)/components/invoice-form/common";
import {
  getDefaultInvoiceNumberLabel,
  INVOICE_PDF_TRANSLATIONS,
} from "@/app/(main)/(app)/pdf-i18n-translations/pdf-translations";
import {
  formatDateWithLocale,
  formatTodayWithLocale,
} from "@/app/(main)/(app)/utils/format-date-with-locale";
import { formatMoneyForTemplate } from "@/app/(main)/(app)/utils/format-money-for-template";
import {
  getCurrentMonthAndYear,
  isServicePeriodStartInCurrentMonth,
} from "@/app/(main)/(app)/utils/format-service-period";
import {
  DEFAULT_PAYMENT_TERM_DAYS,
  getPaymentDueForTerm,
  getPaymentTermDays,
} from "@/app/(main)/(app)/utils/payment-terms";
import {
  type InvoiceData,
  LANGUAGE_TO_LABEL_WITH_REGION,
  DEFAULT_DATE_FORMAT,
  getDateFormatsForLanguage,
  getDefaultDateFormat,
  getNumberFormatLocaleAfterLanguageChange,
  type SupportedNumberFormatLocale,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
  SUPPORTED_NUMBER_FORMAT_LOCALES,
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
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";

import { convertFileToBase64, validateImageSize } from "../utils/logo-upload";
import { StaleDatesBanner } from "./components/stale-dates-banner";
import { StripeTopLineColorPicker } from "./components/stripe-top-line-color-picker";

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
  const currency = useWatch({ control, name: "currency" });
  const numberFormatLocale = useWatch({ control, name: "numberFormatLocale" });
  const preserveNumberFormatOnLanguageChange = useWatch({
    control,
    name: "preserveNumberFormatOnLanguageChange",
  });
  const invoiceTotal = useWatch({ control, name: "total" });
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

  const isServicePeriodFieldVisible = useWatch({
    control,
    name: "servicePeriodFieldIsVisible",
  });
  const isDateOfServiceFieldVisible = useWatch({
    control,
    name: "dateOfServiceFieldIsVisible",
  });
  const isEndDatePrintedAsDateOfSales =
    template === "default" && isDateOfServiceFieldVisible;

  // only the default template prints the end date a second time, as the date of sales,
  // and only while that field is shown; a warning takes the helper's place
  const isServicePeriodEndHelperVisible =
    template === "default" &&
    isDateOfServiceFieldVisible &&
    isDateOfServiceEndOfMonth &&
    !errors.dateOfService;

  // the label the PDF prints, so the helper quotes it exactly, edits and language included
  const printedDateOfServiceLabel =
    dateOfServiceLabelText || defaultDateOfServiceLabel;

  const isDefaultInvoiceNumberLabel =
    invoiceNumberLabel === defaultInvoiceNumberLabel;

  // extract the month and year from the invoice number (i.e. 1/04-2025 -> 04-2025)
  const extractInvoiceMonthAndYear = /(\d{2}-\d{4})/.exec(
    invoiceNumberValue ?? "",
  )?.[1];

  const isInvoiceNumberInCurrentMonth =
    extractInvoiceMonthAndYear === getCurrentMonthAndYear();

  // the same value the stale dates banner moves the invoice number to
  const currentMonthInvoiceNumber = `1/${getCurrentMonthAndYear()}`;

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

  const isPaymentDueBeforeDateOfIssue = dayjs(paymentDue).isBefore(
    dayjs(dateOfIssue),
  );

  const paymentTermDays = dayjs(paymentDue).diff(dayjs(dateOfIssue), "day");

  // default browser date input format is YYYY-MM-DD
  const suggestedPaymentDue = getPaymentDueForTerm({
    dateOfIssue,
    paymentTermDays: DEFAULT_PAYMENT_TERM_DAYS,
  });

  // Helper texts quote dates back to the user, so they are formatted the way the
  // PDF will render them: the invoice's date format AND its language.
  const formattedToday = formatTodayWithLocale({
    selectedDateFormat,
    language,
  });
  const formattedStartOfMonth = formatDateWithLocale({
    date: dayjs().startOf("month"),
    selectedDateFormat,
    language,
  });
  const formattedEndOfMonth = formatDateWithLocale({
    date: dayjs().endOf("month"),
    selectedDateFormat,
    language,
  });
  const formattedSuggestedPaymentDue = formatDateWithLocale({
    date: suggestedPaymentDue,
    selectedDateFormat,
    language,
  });

  /**
   * Whether to show Stale Dates Banner.
   * Banner appears when any invoice date/number is out of sync with current month.
   * Triggers: service end not end of current month, service start not in current month,
   * invoice number not for current month, issue date not today, payment due before the date
   * of issue. Any due date on or after the date of issue is a payment term of its own, and it
   * moves along when the date of issue does.
   */
  const canShowStaleDatesBanner =
    !isDateOfServiceEndOfMonth ||
    isServicePeriodStartOutsideCurrentMonth ||
    !isInvoiceNumberInCurrentMonth ||
    isDateOfIssueNotToday ||
    (!!dateOfIssue && isPaymentDueBeforeDateOfIssue);

  return (
    <div className="space-y-5">
      {/* PDF SETTINGS */}
      <FormGroup title="PDF settings">
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

                    // `invoice_template` is the key `download_invoice` already reports the
                    // template under, so the two read together in the dashboard.
                    umamiTrackEvent("invoice_template_changed", {
                      data: {
                        invoice_template: newTemplate,
                        previous_invoice_template: template,
                      },
                    });

                    // When the user changes the invoice template, automatically update the invoice number label
                    // so it matches the default convention for the selected template and current language.
                    setValue(
                      "invoiceNumberObject.label",
                      getDefaultInvoiceNumberLabel(language, newTemplate),
                    );

                    // Handles template-specific form updates for better UX

                    // The template decides whether the month is spelled out, the language
                    // decides how that month is written.
                    setValue(
                      "dateFormat",
                      getDefaultDateFormat({ language, template: newTemplate }),
                    );

                    if (newTemplate === "stripe") {
                      // Set unit field to be HIDDEN by default for Stripe template (matches stripe template behaviour)
                      setValue("items.0.unitFieldIsVisible", false);

                      // Set service period field to be VISIBLE for Stripe template (for backwards compatibility)
                      setValue("servicePeriodFieldIsVisible", true);
                    } else if (newTemplate === "default") {
                      // Clear Stripe-specific fields when not using Stripe template
                      if (errors.stripePayOnlineUrl) {
                        setValue("stripePayOnlineUrl", "");
                      }

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
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Language PDF Select */}
          <div className="min-w-0">
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

                      umamiTrackEvent("invoice_language_changed", {
                        data: {
                          language: newLanguage,
                          previous_language: language,
                          invoice_template: template,
                          number_format_preserved:
                            !!preserveNumberFormatOnLanguageChange,
                        },
                      });

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

                      // Update DATE FORMAT when language changes, so the spelled-out month
                      // the Stripe template prints reads the way the language writes it
                      setValue(
                        "dateFormat",
                        getDefaultDateFormat({
                          language: newLanguage,
                          template,
                        }),
                      );

                      // Update NUMBER FORMAT when language changes, so the amounts are
                      // punctuated the way the new language punctuates them. It stays a
                      // separate field because the two can legitimately differ -- a Polish
                      // issuer writing an English invoice may still want "10 000,00 EUR",
                      // which is what `preserveNumberFormatOnLanguageChange` is for.
                      //
                      // Preserving it has to write the resolved value rather than skip the
                      // write: an invoice that never picked a format carries none and falls
                      // back to its own language, so leaving it empty would let the format
                      // follow the language anyway. Pinning the language being left behind
                      // is what actually preserves what is on screen.
                      setValue(
                        "numberFormatLocale",
                        getNumberFormatLocaleAfterLanguageChange({
                          previousLanguage: language,
                          nextLanguage: newLanguage,
                          numberFormatLocale,
                          preserveNumberFormatOnLanguageChange,
                        }),
                      );

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
                    {SUPPORTED_INVOICE_PDF_LANGUAGES.map((lang) => {
                      const languageName = LANGUAGE_TO_LABEL_WITH_REGION[lang];

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
            ) : null}
          </div>

          {/* Currency Select */}
          <div className="min-w-0">
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
            ) : null}
          </div>
        </div>

        {/* FORMATTING */}
        <SubGroup title="Formatting">
          <div className="space-y-4">
            {/* Date Format */}
            <div className="min-w-0">
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
                      {getDateFormatsForLanguage(language).map((format) => {
                        const preview = formatTodayWithLocale({
                          selectedDateFormat: format,
                          language,
                        });
                        // The marker follows the same resolver the form applies, so it
                        // points at the Stripe template's long date when that is what a
                        // reset would pick.
                        const isDefault =
                          format ===
                          getDefaultDateFormat({ language, template });

                        // `[de]` is dayjs escape syntax for a literal. The brackets mean
                        // nothing to the reader, so the pattern is shown without them.
                        // oxlint-disable-next-line unicorn/prefer-string-replace-all -- `String#replaceAll` is Safari 13.1; `.browserslistrc` targets Safari 12, and SWC lowers syntax but never polyfills a built-in
                        const patternLabel = format.replace(/[[\]]/g, "");

                        return (
                          <option key={format} value={format}>
                            {patternLabel} ({preview}){" "}
                            {isDefault ? "(default)" : ""}
                          </option>
                        );
                      })}
                    </SelectNative>
                  );
                }}
              />
              {errors.dateFormat ? (
                <ErrorMessage>{errors.dateFormat.message}</ErrorMessage>
              ) : null}
            </div>

            {/* Number Format */}
            <div className="min-w-0">
              <Label htmlFor={`numberFormatLocale`} className="mb-1">
                Number Format
              </Label>
              <Controller
                name="numberFormatLocale"
                control={control}
                render={({ field }) => {
                  return (
                    <SelectNative
                      {...field}
                      // invoices saved before this setting existed carry no value, and they
                      // are written in their own language, which is what they fall back to
                      value={field.value ?? language}
                      id={`numberFormatLocale`}
                      className={cn(
                        "block",
                        inputErrorClassName(!!errors.numberFormatLocale),
                      )}
                      onChange={(e) => {
                        field.onChange(e);

                        // the previous value falls back the same way the rendered
                        // value does, so the event reports the format that was on
                        // screen rather than an empty one
                        umamiTrackEvent("invoice_number_format_changed", {
                          data: {
                            number_format_locale: e.target
                              .value as SupportedNumberFormatLocale,
                            previous_number_format_locale:
                              numberFormatLocale ?? language,
                            invoice_language: language,
                            invoice_template: template,
                          },
                        });
                      }}
                    >
                      {SUPPORTED_NUMBER_FORMAT_LOCALES.map(
                        (supportedNumberFormatLocale) => {
                          const label =
                            supportedNumberFormatLocale === "international"
                              ? "International"
                              : LANGUAGE_TO_LABEL_WITH_REGION[
                                  supportedNumberFormatLocale
                                ];

                          // the invoice's own total, written the way the selected template
                          // writes it, so the picker shows the number this invoice's reader
                          // will actually see
                          const preview = formatMoneyForTemplate({
                            amount: invoiceTotal,
                            currency,
                            numberFormatLocale: supportedNumberFormatLocale,
                            template,
                          });

                          // switching the invoice language moves the format with it, so the
                          // marker sits on the language the invoice is written in
                          const isDefault =
                            supportedNumberFormatLocale === language;

                          return (
                            <option
                              key={supportedNumberFormatLocale}
                              value={supportedNumberFormatLocale}
                            >
                              {label} ({preview}) {isDefault ? "(default)" : ""}
                            </option>
                          );
                        },
                      )}
                    </SelectNative>
                  );
                }}
              />
              {errors.numberFormatLocale ? (
                <ErrorMessage>{errors.numberFormatLocale.message}</ErrorMessage>
              ) : null}
            </div>
          </div>

          {/** Keep the format when the PDF language changes */}
          <div>
            <div className="inline-flex items-center gap-2">
              <Controller
                name="preserveNumberFormatOnLanguageChange"
                control={control}
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Switch
                      {...field}
                      id="preserveNumberFormatOnLanguageChange"
                      data-testid="preserveNumberFormatOnLanguageChange"
                      // the field is absent until someone turns it on, and absent is off
                      checked={!!value}
                      onCheckedChange={(checked) => {
                        onChange(checked);

                        umamiTrackEvent(
                          "invoice_number_format_preserve_toggled",
                          {
                            data: {
                              preserve_number_format: checked,
                              number_format_locale:
                                numberFormatLocale ?? language,
                              invoice_language: language,
                              invoice_template: template,
                            },
                          },
                        );
                      }}
                      size="sm"
                    />
                  );
                }}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor="preserveNumberFormatOnLanguageChange">
                    Keep number format when changing language
                  </Label>
                }
                content="Turn on to keep your number format when the PDF language changes."
              />
            </div>
            <InputHelperMessage>
              {preserveNumberFormatOnLanguageChange
                ? "Changing the PDF language keeps the number format."
                : "Changing the PDF language also changes the number format."}
            </InputHelperMessage>
          </div>
        </SubGroup>
      </FormGroup>

      {/* INVOICE DETAILS */}
      <FormGroup title="Invoice details">
        {/* Invoice number */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <Label htmlFor="invoiceNumberLabel">Invoice number label</Label>
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
            <div className="min-w-0">
              <Label htmlFor="invoiceNumberValue">Invoice number</Label>
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
                <FieldWarning
                  message="Not current month"
                  fixValue={currentMonthInvoiceNumber}
                  fixLabel={`Set invoice number to ${currentMonthInvoiceNumber}`}
                  onFix={() => {
                    setValue(
                      "invoiceNumberObject.value",
                      currentMonthInvoiceNumber,
                    );
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Date of issue and payment due */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            {/* Date of Issue */}
            <div className="min-w-0">
              <Label htmlFor={`dateOfIssue`} className="mb-1">
                Date of issue
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
                        // read before `field.onChange`, while it is still the old date
                        const currentPaymentTermDays = getPaymentTermDays({
                          dateOfIssue: field.value,
                          paymentDue,
                        });

                        field.onChange(e);

                        const newDate = e.target.value;

                        // the payment due date moves along with the date of issue, keeping
                        // the payment term ("Due 7 days after issue") the invoice already has
                        if (newDate) {
                          setValue(
                            "paymentDue",
                            getPaymentDueForTerm({
                              dateOfIssue: newDate,
                              paymentTermDays: currentPaymentTermDays,
                            }),
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
                <FieldWarning
                  message="Not today"
                  fixValue={formattedToday}
                  fixLabel={`Set date of issue to today (${formattedToday})`}
                  onFix={() => {
                    const today = dayjs().format("YYYY-MM-DD");

                    setValue("dateOfIssue", today);
                    setValue(
                      "paymentDue",
                      getPaymentDueForTerm({
                        dateOfIssue: today,
                        paymentTermDays: getPaymentTermDays({
                          dateOfIssue,
                          paymentDue,
                        }),
                      }),
                    );
                  }}
                />
              ) : null}
            </div>

            {/* Payment Due */}
            <div className="min-w-0">
              <Label htmlFor={`paymentDue`} className="mb-1">
                Payment due
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
                      className={inputErrorClassName(!!errors.paymentDue)}
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
                <FieldWarning
                  message="Before date of issue"
                  fixValue={formattedSuggestedPaymentDue}
                  fixLabel={`Set payment due date to ${formattedSuggestedPaymentDue} (14 days after issue)`}
                  onFix={() => {
                    setValue("paymentDue", suggestedPaymentDue);
                  }}
                />
              ) : null}
            </div>
          </div>

          {/* Payment terms shortcuts */}
          {dateOfIssue && !errors.paymentDue ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-zinc-700/90">
                {/* a due date before the date of issue has no term to name (the warning
                    under the field says what is wrong), so the pills are offered as the way out */}
                {paymentTermDays >= 0
                  ? `Due ${paymentTermDays} ${paymentTermDays === 1 ? "day" : "days"} after issue`
                  : "Pick a payment term"}
              </p>
              <div
                role="group"
                aria-label="Payment terms"
                className="inline-flex gap-1"
              >
                {PAYMENT_TERM_DAYS.map((days) => {
                  const isSelected = days === paymentTermDays;

                  return (
                    <button
                      key={days}
                      type="button"
                      aria-pressed={isSelected}
                      className={cn(
                        "h-6 rounded-full border px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1",
                        isSelected
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                      )}
                      onClick={() => {
                        setValue(
                          "paymentDue",
                          dayjs(dateOfIssue)
                            .add(days, "days")
                            .format("YYYY-MM-DD"),
                        );
                      }}
                    >
                      {days} days
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* the legend is for assistive tech, the heading next to the switch is what is seen */}
        <fieldset className="min-w-0 space-y-4 border-t border-zinc-200 pt-4">
          <legend className="sr-only">Service period</legend>

          {/** Service period PDF visibility toggle */}
          <div className="flex items-center justify-between gap-2">
            <h3 aria-hidden className="text-sm font-semibold">
              Service period
            </h3>
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
                      size="sm"
                      aria-label='Show the "Service period" (Service period start and end) field in the PDF'
                    />
                  );
                }}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor="servicePeriodFieldIsVisible">
                    Show in PDF
                  </Label>
                }
                content='Show the "Service period" (Service period start and end) field in the PDF'
              />
            </div>
          </div>

          {/** Service period PDF label - default template only */}
          {template === "default" ? (
            <div className={hiddenInPdfClassName(!isServicePeriodFieldVisible)}>
              <Label htmlFor="servicePeriodLabelText">
                Service period label
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
          ) : null}

          {/** Service period start and end inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                "min-w-0",
                hiddenInPdfClassName(!isServicePeriodFieldVisible),
              )}
            >
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
                <FieldWarning
                  message="Not current month"
                  fixValue={formattedStartOfMonth}
                  fixLabel={`Set service period start to ${formattedStartOfMonth}`}
                  onFix={() => {
                    setValue(
                      "dateOfServiceStart",
                      dayjs().startOf("month").format("YYYY-MM-DD"),
                    );
                  }}
                />
              ) : null}
            </div>

            {/* the end date is also the "Date of sales" on the default template, so it is
                only left out when neither prints it */}
            <div
              className={cn(
                "min-w-0",
                hiddenInPdfClassName(
                  !isServicePeriodFieldVisible &&
                    !isEndDatePrintedAsDateOfSales,
                ),
              )}
            >
              <Label htmlFor="dateOfService" className="mb-1">
                Service period end
              </Label>

              <Controller
                name="dateOfService"
                control={control}
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      type="date"
                      id="dateOfService"
                      aria-describedby={
                        isServicePeriodEndHelperVisible
                          ? "dateOfService-helper"
                          : undefined
                      }
                      className={inputErrorClassName(!!errors.dateOfService)}
                    />
                  );
                }}
              />
              {errors.dateOfService ? (
                <ErrorMessage>{errors.dateOfService.message}</ErrorMessage>
              ) : null}
              {!isDateOfServiceEndOfMonth && !errors.dateOfService ? (
                <FieldWarning
                  message="Not end of current month"
                  fixValue={formattedEndOfMonth}
                  fixLabel={`Set service period end to ${formattedEndOfMonth}`}
                  onFix={() => {
                    setValue(
                      "dateOfService",
                      dayjs().endOf("month").format("YYYY-MM-DD"),
                    );
                  }}
                />
              ) : null}
              {/* only the default template also prints the end date as the "Date of sales",
                  which is what the helper is there to say; a warning takes its place */}
              {isServicePeriodEndHelperVisible ? (
                <p
                  id="dateOfService-helper"
                  className="mt-1 text-pretty text-xs text-zinc-700/90"
                >
                  {/* with the service period hidden, this date is printed only once */}
                  {isServicePeriodFieldVisible ? "Also printed" : "Printed"} as
                  “{printedDateOfServiceLabel}”
                </p>
              ) : null}
            </div>
          </div>

          {/** "Date of sales" PDF label - default template only */}
          {template === "default" ? (
            <div className={FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME}>
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="dateOfServiceLabelText">
                  Date of sales label
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
                          size="sm"
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
      </FormGroup>

      {/* HEADER & BRANDING */}
      <FormGroup title="Header & Branding">
        {/* Header Notes - Purpose is to add a custom text to the header of the invoice */}
        <div className={FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME}>
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
                      size="sm"
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

        {/* Top line color - Only for Stripe template */}
        {template === "stripe" ? (
          <div data-testid="stripe-top-line-color">
            <Controller
              name="stripeTopLineColor"
              control={control}
              render={({ field }) => {
                return (
                  <StripeTopLineColorPicker
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.stripeTopLineColor}
                  />
                );
              }}
            />
            {errors.stripeTopLineColor ? (
              <ErrorMessage>{errors.stripeTopLineColor.message}</ErrorMessage>
            ) : null}
          </div>
        ) : null}

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
                Adds a &quot;Pay Online&quot; button to the PDF.
              </InputHelperMessage>
            )}
          </div>
        ) : null}
      </FormGroup>
    </div>
  );
});

interface FieldWarningProps {
  /** What is off, in two or three words ("Not today", "Before date of issue"). */
  message: string;
  /** The value the fix sets, as the PDF will show it. */
  fixValue: string;
  /** The fix button's accessible name, which also says which field it sets. */
  fixLabel: string;
  onFix: () => void;
}

/**
 * The amber line under a field that is out of date or out of order. The wording stays the
 * same however far off the value is (last month, last year, next month): the field shows
 * the old value and the fix button the new one, year included, so the message never has to.
 */
function FieldWarning({
  message,
  fixValue,
  fixLabel,
  onFix,
}: FieldWarningProps) {
  return (
    <InputHelperMessage>
      {/* stacked rather than side by side: in the half-width columns the fix would wrap
          onto its own line anyway, and a separator left hanging at the end reads worse */}
      <span className="flex items-center text-amber-800">
        <AlertIcon />
        {message}
      </span>
      <ButtonHelper
        aria-label={fixLabel}
        // tapped straight from the focused input above it, where Safari would otherwise
        // retarget the click; see the same note in `stale-dates-banner.tsx`
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={onFix}
      >
        Use {fixValue}
      </ButtonHelper>
    </InputHelperMessage>
  );
}

/**
 * One titled group of the section. A `fieldset`, so assistive tech (and the e2e suite)
 * can address each group by its title.
 */
function FormGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-4 border-b border-zinc-200 pb-5 last:border-b-0 last:pb-0">
      <legend className="text-sm font-semibold text-zinc-900">{title}</legend>
      {children}
    </fieldset>
  );
}

/** A titled part of a {@link FormGroup}, set apart from what comes before it by a rule. */
function SubGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 border-t border-zinc-200 pt-4">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {children}
    </div>
  );
}

/** One-click payment terms offered under "Payment due", in days after the date of issue. */
const PAYMENT_TERM_DAYS = [7, 14, 30] as const;
