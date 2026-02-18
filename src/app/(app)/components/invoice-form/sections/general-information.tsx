import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";
import {
  CURRENCY_SYMBOLS,
  CURRENCY_TO_LABEL,
  DEFAULT_DATE_FORMAT,
  LANGUAGE_TO_LABEL,
  STRIPE_DEFAULT_DATE_FORMAT,
  SUPPORTED_TEMPLATES,
  TEMPLATE_TO_LABEL,
  type InvoiceData,
} from "@/app/schema";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_LANGUAGES,
} from "@/app/schema";
import { ButtonHelper } from "@/components/ui/button-helper";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { AlertTriangle, Upload, X, InfoIcon } from "lucide-react";
import { memo, useCallback, useRef } from "react";
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
}

export const GeneralInformation = memo(function GeneralInformation({
  control,
  errors,
  setValue,
  dateOfIssue,
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
        toast.success("Logo uploaded successfully!");
      } catch (error) {
        console.error("Error converting file to base64:", error);
        toast.error("Error uploading image. Please try again.");
      }
    },
    [setValue],
  );

  const handleLogoRemove = useCallback(() => {
    setValue("logo", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Logo removed successfully!");
  }, [setValue]);

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

                    // Set unit field to be hidden by default for Stripe template (backwards compatibility)
                    setValue("items.0.unitFieldIsVisible", false);
                  } else {
                    // DEFAULT TEMPLATE

                    // Clear Stripe-specific fields when not using Stripe template
                    if (errors.stripePayOnlineUrl) {
                      setValue("stripePayOnlineUrl", "");
                    }

                    // Clear logo when template is default
                    if (logo) {
                      setValue("logo", "");
                    }

                    // Set date format to "YYYY-MM-DD" when template is default
                    setValue("dateFormat", DEFAULT_DATE_FORMAT);
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

        {/* Logo Upload - Only for Stripe template */}
        {template === "stripe" && (
          <div className="duration-500 animate-in fade-in slide-in-from-bottom-2">
            <Label htmlFor="logoUpload" className="mb-2">
              Company Logo (Optional)
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
              <div data-testid="stripe-logo-upload-input">
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

            {errors.logo && <ErrorMessage>{errors.logo.message}</ErrorMessage>}
          </div>
        )}

        {/* Pay Online URL - Only for Stripe template */}
        {template === "stripe" && (
          <div className="duration-500 animate-in fade-in slide-in-from-bottom-2">
            <Label htmlFor={`stripePayOnlineUrl`} className="">
              Payment Link URL (Optional)
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
            render={({ field }) => {
              return (
                <SelectNative {...field} id={`currency`} className="block">
                  {SUPPORTED_CURRENCIES.map((currency) => {
                    const currencySymbol = CURRENCY_SYMBOLS[currency] || null;

                    const currencyFullName =
                      CURRENCY_TO_LABEL[currency] || null;

                    return (
                      <option
                        key={currency}
                        value={currency}
                        defaultValue={SUPPORTED_CURRENCIES[0]}
                      >
                        {currency} {currencySymbol} {currencyFullName}
                      </option>
                    );
                  })}
                </SelectNative>
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
                  <div className="mt-1 flex flex-col items-start text-balance text-xs text-zinc-700/90">
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
                        Set Invoice No. as{" "}
                        <span className="font-bold">
                          current month ({`1/${CURRENT_MONTH_AND_YEAR}`})
                        </span>
                      </span>
                    </ButtonHelper>
                  </div>
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
              <Input {...field} type="date" id={`dateOfIssue`} className="" />
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
                }}
              >
                <span className="text-pretty">
                  Set date of issue to{" "}
                  <span className="font-bold">
                    today ({dayjs().format(selectedDateFormat)})
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

        {!isDateOfServiceEqualsEndOfCurrentMonth ||
        !isInvoiceNumberInCurrentMonth ||
        isDateOfIssueNotToday ? (
          <div className="max-w-[400px] rounded-md border border-blue-200 bg-blue-50 p-4 shadow-sm shadow-blue-200/50 duration-500 animate-in fade-in slide-in-from-bottom-2">
            <InputHelperMessage>
              <span className="flex items-start gap-1.5 text-pretty text-blue-800">
                <InfoIcon className="mt-0.5 inline-block size-3.5 shrink-0 text-blue-800" />
                <div>
                  <span className="mb-2 inline-block">
                    Some dates are out of date. Click the button to update all
                    at once:
                  </span>
                  <ul className="list-disc space-y-1 text-balance pl-5">
                    <li>
                      Date of issue to{" "}
                      <span className="font-bold">
                        today ({dayjs().locale("en").format(selectedDateFormat)}
                        )
                      </span>
                    </li>
                    <li>
                      Date of service to{" "}
                      <span className="font-bold">
                        end of current month (
                        {dayjs()
                          .locale("en")
                          .endOf("month")
                          .format(selectedDateFormat)}
                        )
                      </span>
                    </li>
                    <li>
                      Invoice number to{" "}
                      <span className="font-bold">
                        current month ({`1/${CURRENT_MONTH_AND_YEAR}`})
                      </span>
                    </li>
                    <li>
                      Payment due date to{" "}
                      <span className="font-bold">
                        14 days from today (
                        {dayjs()
                          .locale("en")
                          .add(14, "days")
                          .format(selectedDateFormat)}
                        )
                      </span>
                    </li>
                  </ul>
                </div>
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 text-slate-950 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => {
                  const today = dayjs().format("YYYY-MM-DD");

                  const lastDayOfCurrentMonth = dayjs()
                    .endOf("month")
                    .format("YYYY-MM-DD");

                  // Update date of service to end of current month
                  setValue("dateOfService", lastDayOfCurrentMonth);

                  // Update date of issue to today
                  setValue("dateOfIssue", today);

                  // Update invoice number to current month/year
                  setValue(
                    "invoiceNumberObject.value",
                    `1/${CURRENT_MONTH_AND_YEAR}`,
                  );

                  // Update payment due date to 14 days from today
                  const newPaymentDue = dayjs(today)
                    .add(14, "days")
                    .format("YYYY-MM-DD");

                  setValue("paymentDue", newPaymentDue);
                }}
              >
                Update all dates
              </Button>
            </InputHelperMessage>
          </div>
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
      </div>
    </div>
  );
});
