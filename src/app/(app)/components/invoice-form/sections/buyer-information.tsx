"use client";

import { type BuyerData, type InvoiceData } from "@/app/schema";
import { BuyerManagement } from "@/components/buyer-management";
import { AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
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

interface BuyerInformationProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  isMobile: boolean;
}

export const BuyerInformation = memo(function BuyerInformation({
  control,
  errors,
  setValue,
  invoiceData,
  isMobile,
}: BuyerInformationProps) {
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const isBuyerSelected = !!selectedBuyerId;

  const currentFormValues = {
    name: invoiceData.buyer.name,
    address: invoiceData.buyer.address,
    vatNo: invoiceData.buyer.vatNo,
    vatNoLabelText: invoiceData.buyer.vatNoLabelText,
    email: invoiceData.buyer.email,
    emailFieldIsVisible: invoiceData.buyer.emailFieldIsVisible,
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
          isMobile={isMobile}
        />
      </div>
      <AccordionContent className="">
        <fieldset className="mt-5 space-y-4" disabled={isBuyerSelected}>
          {isBuyerSelected ? (
            <div
              className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800"
              data-testid="buyer-locked-banner"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="">
                To modify buyer details, click the &quot;Edit buyer&quot; button
                (pencil icon) next to the dropdown above.
              </p>
            </div>
          ) : null}

          <div>
            <Label htmlFor="buyerName" className="mb-1">
              Name (Required)
            </Label>
            <Controller
              name="buyer.name"
              control={control}
              render={({ field }) => (
                <Textarea {...field} id="buyerName" rows={3} />
              )}
            />
            {errors.buyer?.name && (
              <ErrorMessage>{errors.buyer.name.message}</ErrorMessage>
            )}
          </div>

          <div>
            <Label htmlFor="buyerAddress" className="mb-1">
              Address (Required)
            </Label>
            <Controller
              name="buyer.address"
              control={control}
              render={({ field }) => (
                <Textarea {...field} id="buyerAddress" rows={3} />
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
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="buyer.vatNoFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Switch
                        {...field}
                        id="buyerVatNoFieldIsVisible"
                        checked={value}
                        onCheckedChange={onChange}
                        className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                        data-testid="buyerVatNoFieldIsVisible"
                        aria-label="Show the 'Buyer Tax Number' Field in the PDF"
                      />
                    )}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor="buyerVatNoFieldIsVisible">
                        Show in PDF
                      </Label>
                    }
                    content={
                      isBuyerSelected
                        ? null
                        : "Show the 'Buyer Tax Number' Field in the PDF"
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="buyerVatNoLabel">Label</Label>
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
                  <Label htmlFor="buyerVatNo">Value</Label>
                  <Controller
                    name="buyer.vatNo"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="buyerVatNo"
                        type="text"
                        placeholder="Enter Tax number value"
                        className="mt-1 block w-full"
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

          {/* Email */}
          <div>
            <div className="relative mb-2 flex items-center justify-between">
              <Label htmlFor="buyerEmail">Email</Label>

              <div className="inline-flex items-center gap-2">
                <Controller
                  name="buyer.emailFieldIsVisible"
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <Switch
                      {...field}
                      id="buyerEmailFieldIsVisible"
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      data-testid="buyerEmailFieldIsVisible"
                      aria-label="Show the 'Email' field in the PDF"
                    />
                  )}
                />
                <CustomTooltip
                  trigger={
                    <Label htmlFor="buyerEmailFieldIsVisible">
                      Show in PDF
                    </Label>
                  }
                  content={
                    isBuyerSelected ? null : "Show the 'Email' field in the PDF"
                  }
                />
              </div>
            </div>
            <Controller
              name="buyer.email"
              control={control}
              render={({ field }) => (
                <Input {...field} id="buyerEmail" type="email" />
              )}
            />
            {errors.buyer?.email && (
              <ErrorMessage>{errors.buyer.email.message}</ErrorMessage>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="relative mb-2 flex items-center justify-between">
              <Label htmlFor="buyerNotes">Notes</Label>

              <div className="inline-flex items-center gap-2">
                <Controller
                  name="buyer.notesFieldIsVisible"
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <Switch
                      {...field}
                      id="buyerNotesFieldIsVisible"
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      data-testid="buyerNotesInvoiceFormFieldVisibilitySwitch"
                      aria-label="Show the 'Notes' field in the PDF"
                    />
                  )}
                />
                <CustomTooltip
                  trigger={
                    <Label htmlFor="buyerNotesFieldIsVisible">
                      Show in PDF
                    </Label>
                  }
                  content={
                    isBuyerSelected ? null : "Show the 'Notes' field in the PDF"
                  }
                />
              </div>
            </div>

            <Controller
              name="buyer.notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="buyerNotes"
                  rows={3}
                  placeholder="Additional information about the buyer"
                />
              )}
            />
            {errors.buyer?.notes && (
              <ErrorMessage>{errors.buyer.notes.message}</ErrorMessage>
            )}
          </div>
        </fieldset>
      </AccordionContent>
    </div>
  );
});
