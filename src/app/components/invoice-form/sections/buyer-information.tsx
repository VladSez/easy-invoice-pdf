import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { InvoiceData, type BuyerData } from "@/app/schema";
import { BuyerManagement } from "@/components/buyer-management";
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

const BUYER_TOOLTIP_CONTENT =
  "Click the edit button next to the 'Select Buyer' dropdown to modify buyer details. Any changes will be automatically saved.";

interface BuyerInformationProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  formPrefixId: FormPrefixId;
  invoiceData: InvoiceData;
}

export const BuyerInformation = memo(function BuyerInformation({
  control,
  errors,
  setValue,
  formPrefixId,
  invoiceData,
}: BuyerInformationProps) {
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const isBuyerSelected = !!selectedBuyerId;

  // Get current form values to pass to BuyerManagement
  const currentFormValues = {
    name: invoiceData.buyer.name,
    address: invoiceData.buyer.address,
    vatNo: invoiceData.buyer.vatNo,
    email: invoiceData.buyer.email,
    vatNoFieldIsVisible: invoiceData.buyer.vatNoFieldIsVisible,
  } satisfies Partial<BuyerData>;

  return (
    <div>
      <div className="relative flex items-end justify-end gap-2">
        <BuyerManagement
          setValue={setValue}
          invoiceData={invoiceData}
          selectedBuyerId={selectedBuyerId}
          setSelectedBuyerId={setSelectedBuyerId}
          formValues={currentFormValues}
        />
      </div>
      <fieldset className="mt-5 space-y-4" disabled={isBuyerSelected}>
        <div>
          {isBuyerSelected ? (
            <LabelWithEditIcon
              htmlFor={`${formPrefixId}-buyerName`}
              content={BUYER_TOOLTIP_CONTENT}
            >
              Name
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`${formPrefixId}-buyerName`} className="mb-1">
              Name
            </Label>
          )}
          <Controller
            name="buyer.name"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`${formPrefixId}-buyerName`}
                rows={3}
                className=""
              />
            )}
          />
          {errors.buyer?.name && (
            <ErrorMessage>{errors.buyer.name.message}</ErrorMessage>
          )}
        </div>

        <div>
          {isBuyerSelected ? (
            <LabelWithEditIcon
              htmlFor={`${formPrefixId}-buyerAddress`}
              content={BUYER_TOOLTIP_CONTENT}
            >
              Address
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`${formPrefixId}-buyerAddress`} className="mb-1">
              Address
            </Label>
          )}
          <Controller
            name="buyer.address"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`${formPrefixId}-buyerAddress`}
                rows={3}
                className=""
              />
            )}
          />
          {errors.buyer?.address && (
            <ErrorMessage>{errors.buyer.address.message}</ErrorMessage>
          )}
        </div>

        <div>
          <div className="relative mb-2 flex items-center justify-between">
            {isBuyerSelected ? (
              <LabelWithEditIcon
                htmlFor={`${formPrefixId}-buyerVatNo`}
                content={BUYER_TOOLTIP_CONTENT}
              >
                VAT Number
              </LabelWithEditIcon>
            ) : (
              <Label htmlFor={`${formPrefixId}-buyerVatNo`} className="">
                VAT Number
              </Label>
            )}

            <div className="inline-flex items-center gap-2">
              <Controller
                name={`buyer.vatNoFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`${formPrefixId}-buyerVatNoFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`${formPrefixId}-buyerVatNoFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content={
                  isBuyerSelected
                    ? null
                    : 'Show/Hide the "Buyer VAT Number" Field in the PDF'
                }
              />
            </div>
          </div>
          <Controller
            name="buyer.vatNo"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={`${formPrefixId}-buyerVatNo`}
                type="text"
                className=""
              />
            )}
          />
          {errors.buyer?.vatNo && (
            <ErrorMessage>{errors.buyer.vatNo.message}</ErrorMessage>
          )}
        </div>

        <div>
          {isBuyerSelected ? (
            <LabelWithEditIcon
              htmlFor={`${formPrefixId}-buyerEmail`}
              content={BUYER_TOOLTIP_CONTENT}
            >
              Email
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`${formPrefixId}-buyerEmail`} className="mb-1">
              Email
            </Label>
          )}
          <Controller
            name="buyer.email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={`${formPrefixId}-buyerEmail`}
                type="email"
                className=""
              />
            )}
          />
          {errors.buyer?.email && (
            <ErrorMessage>{errors.buyer.email.message}</ErrorMessage>
          )}
        </div>
      </fieldset>
    </div>
  );
});
