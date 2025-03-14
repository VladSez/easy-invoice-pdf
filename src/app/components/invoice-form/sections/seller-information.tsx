import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { InvoiceData, type SellerData } from "@/app/schema";
import { SellerManagement } from "@/components/seller-management";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { memo, useState } from "react";
import type { FormPrefixId } from "../..";
import { LabelWithEditIcon } from "@/components/label-with-edit-icon";

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

const SELLER_TOOLTIP_CONTENT =
  "Click the edit button next to the 'Select Seller' dropdown to modify seller details. Any changes will be automatically saved.";

interface SellerInformationProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  formPrefixId: FormPrefixId;
  invoiceData: InvoiceData;
}

export const SellerInformation = memo(function SellerInformation({
  control,
  errors,
  setValue,
  formPrefixId,
  invoiceData,
}: SellerInformationProps) {
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const isSellerSelected = !!selectedSellerId;

  // Get current form values to pass to SellerManagement
  const currentFormValues = {
    name: invoiceData.seller.name,
    address: invoiceData.seller.address,
    vatNo: invoiceData.seller.vatNo,
    email: invoiceData.seller.email,
    accountNumber: invoiceData.seller.accountNumber,
    swiftBic: invoiceData.seller.swiftBic,
    vatNoFieldIsVisible: invoiceData.seller.vatNoFieldIsVisible,
    accountNumberFieldIsVisible: invoiceData.seller.accountNumberFieldIsVisible,
    swiftBicFieldIsVisible: invoiceData.seller.swiftBicFieldIsVisible,
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
      <fieldset className="mt-5 space-y-4" disabled={isSellerSelected}>
        <div>
          {isSellerSelected ? (
            <LabelWithEditIcon
              htmlFor={`${formPrefixId}-sellerName`}
              content={SELLER_TOOLTIP_CONTENT}
            >
              Name
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`${formPrefixId}-sellerName`} className="mb-1">
              Name
            </Label>
          )}
          <Controller
            name="seller.name"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`${formPrefixId}-sellerName`}
                rows={3}
                className=""
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
              htmlFor={`${formPrefixId}-sellerAddress`}
              content={SELLER_TOOLTIP_CONTENT}
            >
              Address
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`${formPrefixId}-sellerAddress`} className="mb-1">
              Address
            </Label>
          )}
          <Controller
            name="seller.address"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`${formPrefixId}-sellerAddress`}
                rows={3}
                className=""
                disabled={!!selectedSellerId}
              />
            )}
          />
          {errors.seller?.address && (
            <ErrorMessage>{errors.seller.address.message}</ErrorMessage>
          )}
        </div>

        <div>
          <div className="relative mb-2 flex items-center justify-between">
            {isSellerSelected ? (
              <LabelWithEditIcon
                htmlFor={`${formPrefixId}-sellerVatNo`}
                content={SELLER_TOOLTIP_CONTENT}
              >
                VAT Number
              </LabelWithEditIcon>
            ) : (
              <Label htmlFor={`${formPrefixId}-sellerVatNo`} className="">
                VAT Number
              </Label>
            )}

            {/* Show/hide Seller VAT Number field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`seller.vatNoFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`${formPrefixId}-sellerVatNoFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`${formPrefixId}-sellerVatNoFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content={
                  isSellerSelected
                    ? null
                    : "Show/Hide the 'Seller VAT Number' Field in the PDF"
                }
              />
            </div>
          </div>
          <Controller
            name="seller.vatNo"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={`${formPrefixId}-sellerVatNo`}
                type="text"
                className=""
              />
            )}
          />
          {errors.seller?.vatNo && (
            <ErrorMessage>{errors.seller.vatNo.message}</ErrorMessage>
          )}
        </div>

        <div>
          {isSellerSelected ? (
            <LabelWithEditIcon
              htmlFor={`${formPrefixId}-sellerEmail`}
              content={SELLER_TOOLTIP_CONTENT}
            >
              Email
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`${formPrefixId}-sellerEmail`} className="mb-1">
              Email
            </Label>
          )}
          <Controller
            name="seller.email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={`${formPrefixId}-sellerEmail`}
                type="email"
                className=""
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
                htmlFor={`${formPrefixId}-sellerAccountNumber`}
                content={SELLER_TOOLTIP_CONTENT}
              >
                Account Number
              </LabelWithEditIcon>
            ) : (
              <Label
                htmlFor={`${formPrefixId}-sellerAccountNumber`}
                className=""
              >
                Account Number
              </Label>
            )}

            {/* Show/hide Account Number field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`seller.accountNumberFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`${formPrefixId}-sellerAccountNumberFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label
                    htmlFor={`${formPrefixId}-sellerAccountNumberFieldIsVisible`}
                  >
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
            render={({ field }) => (
              <Textarea
                {...field}
                id="sellerAccountNumber"
                rows={3}
                className=""
              />
            )}
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
                htmlFor={`${formPrefixId}-sellerSwiftBic`}
                content={SELLER_TOOLTIP_CONTENT}
              >
                SWIFT/BIC
              </LabelWithEditIcon>
            ) : (
              <Label htmlFor={`${formPrefixId}-sellerSwiftBic`} className="">
                SWIFT/BIC
              </Label>
            )}

            {/* Show/hide SWIFT/BIC field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`seller.swiftBicFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`${formPrefixId}-sellerSwiftBicFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label
                    htmlFor={`${formPrefixId}-sellerSwiftBicFieldIsVisible`}
                  >
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
            render={({ field }) => (
              <Textarea {...field} id="sellerSwiftBic" rows={3} className="" />
            )}
          />
          {errors.seller?.swiftBic && (
            <ErrorMessage>{errors.seller.swiftBic.message}</ErrorMessage>
          )}
        </div>
      </fieldset>
    </div>
  );
});
