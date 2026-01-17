"use client";

import { type BuyerData, type InvoiceData } from "@/app/schema";
import { BuyerManagement } from "@/components/buyer-management";
import { LabelWithEditIcon } from "@/components/label-with-edit-icon";
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

export const BUYER_TOOLTIP_CONTENT =
  "Buyer details are locked. Click the Edit Buyer button (Pencil icon) next to the 'Select Buyer' dropdown to modify buyer details. Any changes will be automatically saved.";

interface BuyerInformationProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
}

export const BuyerInformation = memo(function BuyerInformation({
  control,
  errors,
  setValue,
  invoiceData,
}: BuyerInformationProps) {
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const isBuyerSelected = !!selectedBuyerId;

  const HTML_TITLE_CONTENT = isBuyerSelected ? BUYER_TOOLTIP_CONTENT : "";

  // Get current form values to pass to BuyerManagement
  const currentFormValues = {
    name: invoiceData.buyer.name,
    address: invoiceData.buyer.address,
    vatNo: invoiceData.buyer.vatNo,
    vatNoLabelText: invoiceData.buyer.vatNoLabelText,
    email: invoiceData.buyer.email,
    vatNoFieldIsVisible: invoiceData.buyer.vatNoFieldIsVisible,
    notes: invoiceData.buyer.notes,
    notesFieldIsVisible: invoiceData.buyer.notesFieldIsVisible,
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
              htmlFor={`buyerName`}
              content={BUYER_TOOLTIP_CONTENT}
            >
              Name
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`buyerName`} className="mb-1">
              Name
            </Label>
          )}
          <Controller
            name="buyer.name"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`buyerName`}
                rows={3}
                className=""
                readOnly={isBuyerSelected}
                aria-readonly={isBuyerSelected}
                title={HTML_TITLE_CONTENT}
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
              htmlFor={`buyerAddress`}
              content={BUYER_TOOLTIP_CONTENT}
            >
              Address
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`buyerAddress`} className="mb-1">
              Address
            </Label>
          )}
          <Controller
            name="buyer.address"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id={`buyerAddress`}
                rows={3}
                className=""
                readOnly={isBuyerSelected}
                aria-readonly={isBuyerSelected}
                title={HTML_TITLE_CONTENT}
              />
            )}
          />
          {errors.buyer?.address && (
            <ErrorMessage>{errors.buyer.address.message}</ErrorMessage>
          )}
        </div>

        <div>
          <fieldset className="rounded-md border px-4 pb-4">
            <legend className="text-base font-semibold lg:text-lg">
              Buyer Tax Number
            </legend>

            <div className="mb-2 flex items-center justify-end">
              {/* Show/hide Buyer Tax Number field in PDF switch */}
              <div
                className="inline-flex items-center gap-2"
                title={HTML_TITLE_CONTENT}
              >
                <Controller
                  name={`buyer.vatNoFieldIsVisible`}
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <Switch
                      {...field}
                      id={`buyerVatNoFieldIsVisible`}
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      disabled={isBuyerSelected}
                      data-testid={`buyerVatNoFieldIsVisible`}
                      aria-label={`Show/hide the 'Buyer Tax Number' Field in the PDF`}
                    />
                  )}
                />
                <CustomTooltip
                  trigger={
                    <Label htmlFor={`buyerVatNoFieldIsVisible`}>
                      Show in PDF
                    </Label>
                  }
                  content={
                    isBuyerSelected
                      ? null
                      : "Show/Hide the 'Buyer Tax Number' Field in the PDF"
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                {isBuyerSelected ? (
                  <LabelWithEditIcon
                    htmlFor="buyerVatNoLabel"
                    content={BUYER_TOOLTIP_CONTENT}
                  >
                    Label
                  </LabelWithEditIcon>
                ) : (
                  <Label htmlFor="buyerVatNoLabel">Label</Label>
                )}
                <Controller
                  name="buyer.vatNoLabelText"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      id="buyerVatNoLabel"
                      placeholder="Enter Tax number label"
                      className="mt-1 block w-full"
                      readOnly={isBuyerSelected}
                      aria-readonly={isBuyerSelected}
                      title={HTML_TITLE_CONTENT}
                    />
                  )}
                />
                {errors.buyer?.vatNoLabelText && (
                  <ErrorMessage>
                    {errors.buyer.vatNoLabelText.message}
                  </ErrorMessage>
                )}
                {!errors.buyer?.vatNoLabelText && (
                  <InputHelperMessage>
                    Set a custom label (e.g. VAT no, Tax no, etc.)
                  </InputHelperMessage>
                )}
              </div>

              <div>
                {isBuyerSelected ? (
                  <LabelWithEditIcon
                    htmlFor={`buyerVatNo`}
                    content={BUYER_TOOLTIP_CONTENT}
                  >
                    Value
                  </LabelWithEditIcon>
                ) : (
                  <Label htmlFor={`buyerVatNo`}>Value</Label>
                )}
                <Controller
                  name="buyer.vatNo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id={`buyerVatNo`}
                      type="text"
                      placeholder="Enter Tax number value"
                      className="mt-1 block w-full"
                      readOnly={isBuyerSelected}
                      aria-readonly={isBuyerSelected}
                      title={HTML_TITLE_CONTENT}
                    />
                  )}
                />
                {errors.buyer?.vatNo && (
                  <ErrorMessage>{errors.buyer.vatNo.message}</ErrorMessage>
                )}
              </div>
            </div>
          </fieldset>
        </div>

        <div>
          {isBuyerSelected ? (
            <LabelWithEditIcon
              htmlFor={`buyerEmail`}
              content={BUYER_TOOLTIP_CONTENT}
            >
              Email
            </LabelWithEditIcon>
          ) : (
            <Label htmlFor={`buyerEmail`} className="mb-1">
              Email
            </Label>
          )}
          <Controller
            name="buyer.email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={`buyerEmail`}
                type="email"
                className=""
                readOnly={isBuyerSelected}
                aria-readonly={isBuyerSelected}
                title={HTML_TITLE_CONTENT}
              />
            )}
          />
          {errors.buyer?.email && (
            <ErrorMessage>{errors.buyer.email.message}</ErrorMessage>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="relative mb-2 flex items-center justify-between">
            {isBuyerSelected ? (
              <LabelWithEditIcon
                htmlFor={`buyerNotes`}
                content={BUYER_TOOLTIP_CONTENT}
              >
                Notes
              </LabelWithEditIcon>
            ) : (
              <Label htmlFor={`buyerNotes`} className="">
                Notes
              </Label>
            )}

            {/* Show/hide Notes field in PDF switch */}
            <div
              className="inline-flex items-center gap-2"
              title={HTML_TITLE_CONTENT}
            >
              <Controller
                name={`buyer.notesFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`buyerNotesFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                    disabled={isBuyerSelected}
                    data-testid={`buyerNotesInvoiceFormFieldVisibilitySwitch`}
                    aria-label={`Show/hide the 'Notes' field in the PDF`}
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`buyerNotesFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content={
                  isBuyerSelected
                    ? null
                    : "Show/Hide the 'Notes' field in the PDF"
                }
              />
            </div>
          </div>

          <Controller
            name="buyer.notes"
            control={control}
            render={({ field }) => {
              return (
                <Textarea
                  {...field}
                  id={`buyerNotes`}
                  rows={3}
                  className=""
                  readOnly={isBuyerSelected}
                  aria-readonly={isBuyerSelected}
                  title={HTML_TITLE_CONTENT}
                  placeholder="Additional information about the buyer"
                />
              );
            }}
          />
          {errors.buyer?.notes && (
            <ErrorMessage>{errors.buyer.notes.message}</ErrorMessage>
          )}
        </div>
      </fieldset>
    </div>
  );
});
