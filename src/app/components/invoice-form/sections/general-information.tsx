import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { InvoiceData } from "@/app/schema";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_LANGUAGES,
} from "@/app/schema";
import { ButtonHelper } from "@/components/ui/button-helper";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { CURRENCY_SYMBOLS } from "@/components/ui/money-input";
import { SelectNative } from "@/components/ui/select-native";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import dayjs from "dayjs";
import { AlertTriangle } from "lucide-react";
import { memo } from "react";
import type { FormPrefixId } from "../..";

const AlertIcon = () => {
  return <AlertTriangle className="mr-1 inline-block h-3 w-3 text-amber-500" />;
};

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

interface GeneralInformationProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  formPrefixId: FormPrefixId;
  dateOfIssue: string;
}

export const GeneralInformation = memo(function GeneralInformation({
  control,
  errors,
  setValue,
  formPrefixId,
  dateOfIssue,
}: GeneralInformationProps) {
  const invoiceNumber = useWatch({ control, name: "invoiceNumber" });
  const dateOfService = useWatch({ control, name: "dateOfService" });

  const isDateOfIssueNotToday = !dayjs(dateOfIssue).isSame(dayjs(), "day");

  const isDateOfServiceEqualsEndOfCurrentMonth = dayjs(dateOfService).isSame(
    dayjs().endOf("month"),
    "day"
  );

  const extractInvoiceMonthAndYear = invoiceNumber?.split("/")?.[1];

  const isInvoiceNumberInCurrentMonth =
    extractInvoiceMonthAndYear === dayjs().format("MM-YYYY");

  return (
    <div className="space-y-4">
      {/* Language PDF Select */}
      <div>
        <Label htmlFor={`${formPrefixId}-language`} className="mb-1">
          Invoice PDF Language
        </Label>
        <Controller
          name="language"
          control={control}
          render={({ field }) => (
            <SelectNative
              {...field}
              id={`${formPrefixId}-language`}
              className="block"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === "en" ? "English" : "Polish"}
                </option>
              ))}
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
        <Label htmlFor={`${formPrefixId}-currency`} className="mb-1">
          Currency
        </Label>
        <Controller
          name="currency"
          control={control}
          render={({ field }) => {
            return (
              <SelectNative
                {...field}
                id={`${formPrefixId}-currency`}
                className="block"
              >
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
        <Label htmlFor={`${formPrefixId}-dateFormat`} className="mb-1">
          Date Format
        </Label>
        <Controller
          name="dateFormat"
          control={control}
          render={({ field }) => (
            <SelectNative
              {...field}
              id={`${formPrefixId}-dateFormat`}
              className="block"
            >
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
        <Label htmlFor={`${formPrefixId}-invoiceNumber`} className="mb-1">
          Invoice Number
        </Label>
        <Controller
          name="invoiceNumber"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              id={`${formPrefixId}-invoiceNumber`}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          )}
        />
        {errors.invoiceNumber && (
          <ErrorMessage>{errors.invoiceNumber.message}</ErrorMessage>
        )}
        {!isInvoiceNumberInCurrentMonth && !errors.invoiceNumber ? (
          <InputHelperMessage>
            <span className="flex items-center text-balance">
              <AlertIcon />
              Invoice number does not match current month
            </span>

            <ButtonHelper
              onClick={() => {
                const currentMonth = dayjs().format("MM-YYYY");
                setValue("invoiceNumber", `1/${currentMonth}`);
              }}
            >
              Click to set the invoice number to the current month (
              {dayjs().format("MM-YYYY")})
            </ButtonHelper>
          </InputHelperMessage>
        ) : null}
      </div>

      {/* Date of Issue */}
      <div>
        <Label htmlFor={`${formPrefixId}-dateOfIssue`} className="mb-1">
          Date of Issue
        </Label>
        <Controller
          name="dateOfIssue"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              id={`${formPrefixId}-dateOfIssue`}
              className=""
              lang="en-US"
            />
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
        <Label htmlFor={`${formPrefixId}-dateOfService`} className="mb-1">
          Date of Service
        </Label>
        <Controller
          name="dateOfService"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              id={`${formPrefixId}-dateOfService`}
              className=""
              lang="en-US"
            />
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
          <Label htmlFor={`${formPrefixId}-invoiceType`} className="">
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
                  id={`${formPrefixId}-invoiceTypeFieldIsVisible`}
                  checked={value}
                  onCheckedChange={onChange}
                  className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                />
              )}
            />
            <CustomTooltip
              trigger={
                <Label htmlFor={`${formPrefixId}-invoiceTypeFieldIsVisible`}>
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
              id={`${formPrefixId}-invoiceType`}
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
