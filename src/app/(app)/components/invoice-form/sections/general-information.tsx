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
import { TRANSLATIONS } from "@/app/schema/translations";
import dayjs from "dayjs";
import { AlertTriangle, Upload, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

const AlertIcon = () => {
  return (
    <AlertTriangle className="mr-1 inline-block h-3.5 w-3.5 text-amber-500" />
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

  const t = TRANSLATIONS[language];
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

  // Handle template-specific form updates
  useEffect(() => {
    if (template === "stripe") {
      // Set date format to "MMMM D, YYYY" when template is Stripe
      setValue("dateFormat", STRIPE_DEFAULT_DATE_FORMAT);
    } else {
      // Clear Stripe-specific fields when not using Stripe template
      if (errors.stripePayOnlineUrl) {
        setValue("stripePayOnlineUrl", "");
      }

      // Clear logo when template is not stripe
      if (logo) {
        setValue("logo", "");
      }

      // Set date format to "YYYY-MM-DD" when template is not stripe
      setValue("dateFormat", SUPPORTED_DATE_FORMATS[0]);
    }
  }, [template, setValue, errors.stripePayOnlineUrl, logo]);

  return (
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
            <SelectNative {...field} id={`template`} className="block">
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
              Enter your payment URL. This adds a &quot;Pay Online&quot; button
              to the PDF invoice.
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

                // Update invoice number when language changes
                const newLanguage = e.target.value as keyof typeof TRANSLATIONS;

                const newInvoiceNumberLabel =
                  TRANSLATIONS[newLanguage].invoiceNumber;

                // we need to keep the invoice number suffix (e.g. 1/MM-YYYY) for better user experience, when switching language
                setValue(
                  "invoiceNumberObject.label",
                  `${newInvoiceNumberLabel}:`,
                );
                setValue("invoiceNumberObject.value", invoiceNumberValue);
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

                  const currencyFullName = CURRENCY_TO_LABEL[currency] || null;

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
                const isDefault = format === SUPPORTED_DATE_FORMATS[0];

                return (
                  <option key={format} value={format}>
                    {format} (Preview: {preview}) {isDefault ? "(default)" : ""}
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
      <div>
        <fieldset className="rounded-md border p-4">
          <legend className="px-2 text-sm">Invoice Number</legend>
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
                    <span className="mb-2 flex items-center text-amber-800 md:mb-0 lg:mb-2">
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
                      Click to set the invoice number to the current month (
                      {`1/${CURRENT_MONTH_AND_YEAR}`})
                    </ButtonHelper>
                  </div>
                )}
            </div>
          </div>
        </fieldset>
      </div>

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
              <span className="text-balance">
                Set date of issue to {dayjs().format(selectedDateFormat)}{" "}
                (today)
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
              Set date of service to{" "}
              {dayjs().endOf("month").format(selectedDateFormat)} (end of
              current month)
            </ButtonHelper>
          </InputHelperMessage>
        ) : null}
      </div>

      {/* Invoice Type - We don't show this field for Stripe template */}
      {template !== "stripe" && (
        <div>
          <div className="relative mb-2 flex items-center justify-between">
            <Label htmlFor={`invoiceType`} className="">
              Invoice Type
            </Label>

            {/* Show/hide Invoice Type field in PDF switch */}
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
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`invoiceTypeFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content='Show/Hide the "Invoice Type" Field in the PDF'
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
                placeholder="Enter invoice type"
              />
            )}
          />
          {errors.invoiceType && (
            <ErrorMessage>{errors.invoiceType.message}</ErrorMessage>
          )}
        </div>
      )}
    </div>
  );
});
