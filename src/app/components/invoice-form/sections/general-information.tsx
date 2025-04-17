import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";
import {
  CURRENCY_SYMBOLS,
  LANGUAGE_TO_LABEL,
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
import { AlertTriangle } from "lucide-react";
import { memo } from "react";

const AlertIcon = () => {
  return <AlertTriangle className="mr-1 inline-block h-3 w-3 text-amber-500" />;
};

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

const CURRENT_MONTH_AND_YEAR = dayjs().format("MM-YYYY");

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

  const t = TRANSLATIONS[language];
  const defaultInvoiceNumber = `${t.invoiceNumber}:`;

  const isDateOfIssueNotToday = !dayjs(dateOfIssue).isSame(dayjs(), "day");

  const isDateOfServiceEqualsEndOfCurrentMonth = dayjs(dateOfService).isSame(
    dayjs().endOf("month"),
    "day"
  );

  const isDefaultInvoiceNumberLabel =
    invoiceNumberLabel === defaultInvoiceNumber;

  // extract the month and year from the invoice number (i.e. 1/04-2025 -> 04-2025)
  const extractInvoiceMonthAndYear = /(\d{2}-\d{4})/.exec(
    invoiceNumberValue ?? ""
  )?.[1];

  const isInvoiceNumberInCurrentMonth =
    extractInvoiceMonthAndYear === CURRENT_MONTH_AND_YEAR;

  return (
    <div className="space-y-4">
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
                  `${newInvoiceNumberLabel}:`
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

                  return (
                    <option
                      key={currency}
                      value={currency}
                      defaultValue={SUPPORTED_CURRENCIES[0]}
                    >
                      {currency} {currencySymbol}
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
                const preview = dayjs().format(format);
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
                          defaultInvoiceNumber
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
                    <div className="flex flex-col items-center gap-2">
                      <span className="flex items-center text-pretty">
                        Looks like the invoice number does not match current
                        month
                      </span>

                      <ButtonHelper
                        className="text-pretty"
                        onClick={() => {
                          setValue(
                            "invoiceNumberObject.value",
                            `1/${CURRENT_MONTH_AND_YEAR}`
                          );
                        }}
                      >
                        Click to set the invoice number to the current month (
                        {`1/${CURRENT_MONTH_AND_YEAR}`})
                      </ButtonHelper>
                    </div>
                  </InputHelperMessage>
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
            <span className="flex items-center">
              <AlertIcon />
              Date of issue is not today
            </span>

            <ButtonHelper
              onClick={() => {
                const currentMonth = dayjs().format("YYYY-MM-DD");

                setValue("dateOfIssue", currentMonth);
              }}
            >
              Click to set the date to today ({dayjs().format("DD/MM/YYYY")})
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
            <span className="flex items-center">
              <AlertIcon />
              Date of service is not the last day of the current month
            </span>

            <ButtonHelper
              onClick={() => {
                const lastDayOfCurrentMonth = dayjs()
                  .endOf("month")
                  .format("YYYY-MM-DD");

                setValue("dateOfService", lastDayOfCurrentMonth);
              }}
            >
              Click to set the date to the last day of the current month (
              {dayjs().endOf("month").format("DD/MM/YYYY")})
            </ButtonHelper>
          </InputHelperMessage>
        ) : null}
      </div>

      {/* Invoice Type */}
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
                <Label htmlFor={`invoiceTypeFieldIsVisible`}>Show in PDF</Label>
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
    </div>
  );
});
