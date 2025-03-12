import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { InvoiceData } from "@/app/schema";
import { SellerManagement } from "@/components/seller-management";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { memo } from "react";
import type { FormPrefixId } from "../..";

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

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
  return (
    <div>
      <div className="relative flex items-end justify-end gap-2">
        {/* Create/edit/delete seller */}
        <SellerManagement setValue={setValue} invoiceData={invoiceData} />
      </div>
      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor={`${formPrefixId}-sellerName`} className="mb-1">
            Name
          </Label>
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
          <Label htmlFor={`${formPrefixId}-sellerAddress`} className="mb-1">
            Address
          </Label>
          <Controller
            name="seller.address"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`${formPrefixId}-sellerAddress`}
                rows={3}
                className=""
              />
            )}
          />
          {errors.seller?.address && (
            <ErrorMessage>{errors.seller.address.message}</ErrorMessage>
          )}
        </div>

        <div>
          <div className="relative mb-2 flex items-center justify-between">
            <Label htmlFor={`${formPrefixId}-sellerVatNo`} className="">
              VAT Number
            </Label>

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
                content='Show/Hide the "Seller VAT Number" Field in the PDF'
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
          <Label htmlFor={`${formPrefixId}-sellerEmail`} className="mb-1">
            Email
          </Label>
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
            <Label htmlFor={`${formPrefixId}-sellerAccountNumber`} className="">
              Account Number
            </Label>

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
                content='Show/Hide the "Account Number" Field in the PDF'
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
            <Label htmlFor={`${formPrefixId}-sellerSwiftBic`} className="">
              SWIFT/BIC
            </Label>

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
                content='Show/Hide the "SWIFT/BIC" Field in the PDF'
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
      </div>
    </div>
  );
});
