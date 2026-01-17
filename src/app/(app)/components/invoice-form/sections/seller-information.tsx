import { type InvoiceData, type SellerData } from "@/app/schema";
import { LabelWithEditIcon } from "@/components/label-with-edit-icon";
import { SellerManagement } from "@/components/seller-management";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { memo, useState } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

export const SELLER_TOOLTIP_CONTENT =
  "Seller details are locked. Click the Edit Seller button (Pencil icon) next to the 'Select Seller' dropdown to modify seller details.";

interface SellerInformationProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
}

export const SellerInformation = memo(function SellerInformation({
  control,
  errors,
  setValue,
  invoiceData,
}: SellerInformationProps) {
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const isSellerSelected = !!selectedSellerId;

  const HTML_TITLE_CONTENT = isSellerSelected ? SELLER_TOOLTIP_CONTENT : "";

  // Get current form values to pass to SellerManagement
  const currentFormValues = {
    name: invoiceData.seller.name,
    address: invoiceData.seller.address,
    vatNo: invoiceData.seller.vatNo,
    vatNoLabelText: invoiceData.seller.vatNoLabelText,
    email: invoiceData.seller.email,
    accountNumber: invoiceData.seller.accountNumber,
    swiftBic: invoiceData.seller.swiftBic,
    vatNoFieldIsVisible: invoiceData.seller.vatNoFieldIsVisible,
    accountNumberFieldIsVisible: invoiceData.seller.accountNumberFieldIsVisible,
    swiftBicFieldIsVisible: invoiceData.seller.swiftBicFieldIsVisible,
    notes: invoiceData.seller.notes,
    notesFieldIsVisible: invoiceData.seller.notesFieldIsVisible,
  } satisfies Partial<SellerData>;

  return (
    <div>
      <div className="relative flex items-end justify-end gap-2">
        <SellerManagement
          setValue={setValue}
          invoiceData={invoiceData}
          selectedSellerId={selectedSellerId}
          setSelectedSellerId={setSelectedSellerId}
          formValues={currentFormValues}
        />
      </div>
      <fieldset className="mt-5 space-y-4">
        <div>
          {isSellerSelected ? (
            <LabelWithEditIcon
              htmlFor={`sellerName`}
              content={SELLER_TOOLTIP_CONTENT}
            >
              Name
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`sellerName`} className="mb-1">
              Name
            </Label>
          )}
          <Controller
            name="seller.name"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`sellerName`}
                rows={3}
                className=""
                readOnly={isSellerSelected}
                aria-readonly={isSellerSelected}
                title={HTML_TITLE_CONTENT}
              />
            )}
          />
          {errors.seller?.name && (
            <ErrorMessage>{errors.seller.name.message}</ErrorMessage>
          )}
        </div>

        <div>
          {isSellerSelected ? (
            <LabelWithEditIcon
              htmlFor={`sellerAddress`}
              content={SELLER_TOOLTIP_CONTENT}
            >
              Address
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`sellerAddress`} className="mb-1">
              Address
            </Label>
          )}
          <Controller
            name="seller.address"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`sellerAddress`}
                rows={3}
                className=""
                readOnly={isSellerSelected}
                aria-readonly={isSellerSelected}
                title={HTML_TITLE_CONTENT}
              />
            )}
          />
          {errors.seller?.address && (
            <ErrorMessage>{errors.seller.address.message}</ErrorMessage>
          )}
        </div>

        <div>
          <fieldset className="rounded-md border px-4 pb-4">
            <legend className="text-base font-semibold lg:text-lg">
              Seller Tax Number
            </legend>

            <div className="mb-2 flex items-center justify-end">
              {/* Show/hide Seller Tax Number field in PDF switch */}
              <div
                className="inline-flex items-center gap-2"
                title={HTML_TITLE_CONTENT}
              >
                <Controller
                  name={`seller.vatNoFieldIsVisible`}
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <Switch
                      {...field}
                      id={`sellerVatNoFieldIsVisible`}
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      disabled={isSellerSelected}
                      data-testid={`sellerVatNoFieldIsVisible`}
                      aria-label={`Show/hide the 'Seller Tax Number' Field in the PDF`}
                    />
                  )}
                />
                <CustomTooltip
                  trigger={
                    <Label htmlFor={`sellerVatNoFieldIsVisible`}>
                      Show in PDF
                    </Label>
                  }
                  content={
                    isSellerSelected
                      ? null
                      : "Show/Hide the 'Seller Tax Number' Field in the PDF"
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                {isSellerSelected ? (
                  <LabelWithEditIcon
                    htmlFor="sellerVatNoLabel"
                    content={SELLER_TOOLTIP_CONTENT}
                  >
                    Label
                  </LabelWithEditIcon>
                ) : (
                  <Label htmlFor="sellerVatNoLabel">Label</Label>
                )}
                <Controller
                  name="seller.vatNoLabelText"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      id="sellerVatNoLabel"
                      placeholder="Enter Tax number label"
                      className="mt-1 block w-full"
                      readOnly={isSellerSelected}
                      aria-readonly={isSellerSelected}
                      title={HTML_TITLE_CONTENT}
                    />
                  )}
                />
                {errors.seller?.vatNoLabelText && (
                  <ErrorMessage>
                    {errors.seller.vatNoLabelText.message}
                  </ErrorMessage>
                )}
                {!errors.seller?.vatNoLabelText && (
                  <InputHelperMessage>
                    Set a custom label (e.g. VAT no, Tax no, etc.)
                  </InputHelperMessage>
                )}
              </div>

              <div>
                {isSellerSelected ? (
                  <LabelWithEditIcon
                    htmlFor={`sellerVatNo`}
                    content={SELLER_TOOLTIP_CONTENT}
                  >
                    Value
                  </LabelWithEditIcon>
                ) : (
                  <Label htmlFor={`sellerVatNo`}>Value</Label>
                )}
                <Controller
                  name="seller.vatNo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={`sellerVatNo`}
                      type="text"
                      placeholder="Enter Tax number value"
                      className="mt-1 block w-full"
                      readOnly={isSellerSelected}
                      aria-readonly={isSellerSelected}
                      title={HTML_TITLE_CONTENT}
                    />
                  )}
                />
                {errors.seller?.vatNo && (
                  <ErrorMessage>{errors.seller.vatNo.message}</ErrorMessage>
                )}
              </div>
            </div>
          </fieldset>
        </div>

        <div>
          {isSellerSelected ? (
            <LabelWithEditIcon
              htmlFor={`sellerEmail`}
              content={SELLER_TOOLTIP_CONTENT}
            >
              Email
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`sellerEmail`} className="mb-1">
              Email
            </Label>
          )}
          <Controller
            name="seller.email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={`sellerEmail`}
                type="email"
                className=""
                readOnly={isSellerSelected}
                aria-readonly={isSellerSelected}
                title={HTML_TITLE_CONTENT}
              />
            )}
          />
          {errors.seller?.email && (
            <ErrorMessage>{errors.seller.email.message}</ErrorMessage>
          )}
        </div>

        {/* Account Number */}
        <div>
          <div className="relative mb-2 flex items-center justify-between">
            {isSellerSelected ? (
              <LabelWithEditIcon
                htmlFor={`sellerAccountNumber`}
                content={SELLER_TOOLTIP_CONTENT}
              >
                Account Number
              </LabelWithEditIcon>
            ) : (
              <Label htmlFor={`sellerAccountNumber`} className="">
                Account Number
              </Label>
            )}

            {/* Show/hide Account Number field in PDF switch */}
            <div
              className="inline-flex items-center gap-2"
              title={HTML_TITLE_CONTENT}
            >
              <Controller
                name={`seller.accountNumberFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`sellerAccountNumberFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                    disabled={isSellerSelected}
                    data-testid={`sellerAccountNumberFieldIsVisible`}
                    aria-label={`Show/hide the 'Account Number' Field in the PDF`}
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`sellerAccountNumberFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content={
                  isSellerSelected
                    ? null
                    : "Show/Hide the 'Account Number' Field in the PDF"
                }
              />
            </div>
          </div>
          <Controller
            name="seller.accountNumber"
            control={control}
            render={({ field }) => {
              return (
                <Textarea
                  {...field}
                  id={`sellerAccountNumber`}
                  rows={3}
                  className=""
                  readOnly={isSellerSelected}
                  aria-readonly={isSellerSelected}
                  title={HTML_TITLE_CONTENT}
                />
              );
            }}
          />
          {errors.seller?.accountNumber && (
            <ErrorMessage>{errors.seller.accountNumber.message}</ErrorMessage>
          )}
        </div>

        {/* SWIFT/BIC */}
        <div>
          <div className="relative mb-2 flex items-center justify-between">
            {isSellerSelected ? (
              <LabelWithEditIcon
                htmlFor={`sellerSwiftBic`}
                content={SELLER_TOOLTIP_CONTENT}
              >
                SWIFT/BIC
              </LabelWithEditIcon>
            ) : (
              <Label htmlFor={`sellerSwiftBic`} className="">
                SWIFT/BIC
              </Label>
            )}

            {/* Show/hide SWIFT/BIC field in PDF switch */}
            <div
              className="inline-flex items-center gap-2"
              title={HTML_TITLE_CONTENT}
            >
              <Controller
                name={`seller.swiftBicFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`sellerSwiftBicFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                    disabled={isSellerSelected}
                    data-testid={`sellerSwiftBicFieldIsVisible`}
                    aria-label={`Show/hide the 'SWIFT/BIC' Field in the PDF`}
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`sellerSwiftBicFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content={
                  isSellerSelected
                    ? null
                    : "Show/Hide the 'SWIFT/BIC' Field in the PDF"
                }
              />
            </div>
          </div>

          <Controller
            name="seller.swiftBic"
            control={control}
            render={({ field }) => {
              return (
                <Textarea
                  {...field}
                  id={`sellerSwiftBic`}
                  rows={3}
                  className=""
                  readOnly={isSellerSelected}
                  aria-readonly={isSellerSelected}
                  title={HTML_TITLE_CONTENT}
                />
              );
            }}
          />
          {errors.seller?.swiftBic && (
            <ErrorMessage>{errors.seller.swiftBic.message}</ErrorMessage>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="relative mb-2 flex items-center justify-between">
            {isSellerSelected ? (
              <LabelWithEditIcon
                htmlFor={`sellerNotes`}
                content={SELLER_TOOLTIP_CONTENT}
              >
                Notes
              </LabelWithEditIcon>
            ) : (
              <Label htmlFor={`sellerNotes`} className="">
                Notes
              </Label>
            )}

            {/* Show/hide Notes field in PDF switch */}
            <div
              className="inline-flex items-center gap-2"
              title={HTML_TITLE_CONTENT}
            >
              <Controller
                name={`seller.notesFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`sellerNotesFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                    disabled={isSellerSelected}
                    data-testid={`sellerNotesInvoiceFormFieldVisibilitySwitch`}
                    aria-label={`Show/hide the 'Notes' field in the PDF`}
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`sellerNotesFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content={
                  isSellerSelected
                    ? null
                    : "Show/Hide the 'Notes' field in the PDF"
                }
              />
            </div>
          </div>

          <Controller
            name="seller.notes"
            control={control}
            render={({ field }) => {
              return (
                <Textarea
                  {...field}
                  id={`sellerNotes`}
                  rows={3}
                  className=""
                  readOnly={isSellerSelected}
                  aria-readonly={isSellerSelected}
                  title={HTML_TITLE_CONTENT}
                  placeholder="Additional information about the seller"
                />
              );
            }}
          />
          {errors.seller?.notes && (
            <ErrorMessage>{errors.seller.notes.message}</ErrorMessage>
          )}
        </div>
      </fieldset>
    </div>
  );
});
