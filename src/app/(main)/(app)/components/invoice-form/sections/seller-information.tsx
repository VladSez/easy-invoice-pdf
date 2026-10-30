import { memo, useState } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";

import { inputErrorClassName } from "@/app/(main)/(app)/components/invoice-form/common";
import { SavedContactCard } from "@/app/(main)/(app)/components/invoice-form/sections/components/contact-fields";
import { SellerManagement } from "@/app/(main)/(app)/components/invoice-form/sections/components/seller/seller-management";
import { type InvoiceData, type SellerData } from "@/app/schema";
import { AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

interface SellerInformationProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  isMobile: boolean;
}

export const SellerInformation = memo(function SellerInformation({
  control,
  errors,
  setValue,
  invoiceData,
  isMobile,
}: SellerInformationProps) {
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const isSellerSelected = !!selectedSellerId;

  // the form's own value, not `invoiceData`: that one only catches up after the form's
  // debounce, so the card would show the previous seller for half a second after a pick
  const savedSeller = useWatch({ control, name: "seller" });

  const currentFormValues = {
    name: invoiceData.seller.name,
    address: invoiceData.seller.address,
    vatNo: invoiceData.seller.vatNo,
    vatNoLabelText: invoiceData.seller.vatNoLabelText,
    email: invoiceData.seller.email,
    emailFieldIsVisible: invoiceData.seller.emailFieldIsVisible,
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
          isMobile={isMobile}
        />
      </div>
      <AccordionContent className="">
        {isSellerSelected ? (
          <div className="mt-5">
            <SavedContactCard contact={savedSeller} party="seller" />
          </div>
        ) : (
          <fieldset className="mt-5 space-y-4">
            <div>
              <Label htmlFor="sellerName" className="mb-1">
                Name (Required)
              </Label>
              <Controller
                name="seller.name"
                control={control}
                render={({ field }) => {
                  return (
                    <Textarea
                      {...field}
                      id="sellerName"
                      rows={3}
                      className={inputErrorClassName(!!errors.seller?.name)}
                    />
                  );
                }}
              />
              {errors.seller?.name ? (
                <ErrorMessage>{errors.seller.name.message}</ErrorMessage>
              ) : null}
            </div>

            <div>
              <Label htmlFor="sellerAddress" className="mb-1">
                Address (Required)
              </Label>
              <Controller
                name="seller.address"
                control={control}
                render={({ field }) => {
                  return (
                    <Textarea
                      {...field}
                      id="sellerAddress"
                      rows={3}
                      className={inputErrorClassName(!!errors.seller?.address)}
                    />
                  );
                }}
              />
              {errors.seller?.address ? (
                <ErrorMessage>{errors.seller.address.message}</ErrorMessage>
              ) : null}
            </div>

            <div>
              <fieldset className="rounded-md border px-4 pb-4">
                <legend className="text-base font-semibold lg:text-lg">
                  Seller Tax Number
                </legend>

                <div className="mb-2 flex items-center justify-end">
                  <div className="inline-flex items-center gap-2">
                    <Controller
                      name="seller.vatNoFieldIsVisible"
                      control={control}
                      render={({ field: { value, onChange, ...field } }) => {
                        return (
                          <Switch
                            {...field}
                            id="sellerVatNoFieldIsVisible"
                            checked={value}
                            onCheckedChange={onChange}
                            size="sm"
                            data-testid="sellerVatNoFieldIsVisible"
                            aria-label="Show the 'Seller Tax Number' Field in the PDF"
                          />
                        );
                      }}
                    />
                    <CustomTooltip
                      trigger={
                        <Label htmlFor="sellerVatNoFieldIsVisible">
                          Show in PDF
                        </Label>
                      }
                      content={"Show the 'Seller Tax Number' Field in the PDF"}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sellerVatNoLabel">Label</Label>
                    <Controller
                      name="seller.vatNoLabelText"
                      control={control}
                      render={({ field }) => {
                        return (
                          <Input
                            {...field}
                            type="text"
                            id="sellerVatNoLabel"
                            placeholder="Enter Tax number label"
                            className={cn(
                              "mt-1 block w-full",
                              inputErrorClassName(
                                !!errors.seller?.vatNoLabelText,
                              ),
                            )}
                          />
                        );
                      }}
                    />
                    {errors.seller?.vatNoLabelText ? (
                      <ErrorMessage>
                        {errors.seller.vatNoLabelText.message}
                      </ErrorMessage>
                    ) : null}
                    {!errors.seller?.vatNoLabelText ? (
                      <InputHelperMessage>
                        Set a custom label (e.g. VAT no, Tax no, etc.)
                      </InputHelperMessage>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="sellerVatNo">Value</Label>
                    <Controller
                      name="seller.vatNo"
                      control={control}
                      render={({ field }) => {
                        return (
                          <Input
                            {...field}
                            id="sellerVatNo"
                            type="text"
                            placeholder="Enter Tax number value"
                            className={cn(
                              "mt-1 block w-full",
                              inputErrorClassName(!!errors.seller?.vatNo),
                            )}
                          />
                        );
                      }}
                    />
                    {errors.seller?.vatNo ? (
                      <ErrorMessage>{errors.seller.vatNo.message}</ErrorMessage>
                    ) : null}
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Email */}
            <div>
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="sellerEmail">Email</Label>

                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="seller.emailFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Switch
                          {...field}
                          id="sellerEmailFieldIsVisible"
                          checked={value}
                          onCheckedChange={onChange}
                          size="sm"
                          data-testid="sellerEmailFieldIsVisible"
                          aria-label="Show the 'Email' field in the PDF"
                        />
                      );
                    }}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor="sellerEmailFieldIsVisible">
                        Show in PDF
                      </Label>
                    }
                    content={"Show the 'Email' field in the PDF"}
                  />
                </div>
              </div>
              <Controller
                name="seller.email"
                control={control}
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      id="sellerEmail"
                      type="email"
                      className={inputErrorClassName(!!errors.seller?.email)}
                    />
                  );
                }}
              />
              {errors.seller?.email ? (
                <ErrorMessage>{errors.seller.email.message}</ErrorMessage>
              ) : null}
            </div>

            {/* Account Number */}
            <div>
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="sellerAccountNumber">Account Number</Label>

                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="seller.accountNumberFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Switch
                          {...field}
                          id="sellerAccountNumberFieldIsVisible"
                          checked={value}
                          onCheckedChange={onChange}
                          size="sm"
                          data-testid="sellerAccountNumberFieldIsVisible"
                          aria-label="Show the 'Account Number' Field in the PDF"
                        />
                      );
                    }}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor="sellerAccountNumberFieldIsVisible">
                        Show in PDF
                      </Label>
                    }
                    content={"Show the 'Account Number' Field in the PDF"}
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
                      id="sellerAccountNumber"
                      rows={3}
                      className={inputErrorClassName(
                        !!errors.seller?.accountNumber,
                      )}
                    />
                  );
                }}
              />
              {errors.seller?.accountNumber ? (
                <ErrorMessage>
                  {errors.seller.accountNumber.message}
                </ErrorMessage>
              ) : null}
            </div>

            {/* SWIFT/BIC */}
            <div>
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="sellerSwiftBic">SWIFT/BIC</Label>

                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="seller.swiftBicFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Switch
                          {...field}
                          id="sellerSwiftBicFieldIsVisible"
                          checked={value}
                          onCheckedChange={onChange}
                          size="sm"
                          data-testid="sellerSwiftBicFieldIsVisible"
                          aria-label="Show the 'SWIFT/BIC' Field in the PDF"
                        />
                      );
                    }}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor="sellerSwiftBicFieldIsVisible">
                        Show in PDF
                      </Label>
                    }
                    content={"Show the 'SWIFT/BIC' Field in the PDF"}
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
                      id="sellerSwiftBic"
                      rows={3}
                      className={inputErrorClassName(!!errors.seller?.swiftBic)}
                    />
                  );
                }}
              />
              {errors.seller?.swiftBic ? (
                <ErrorMessage>{errors.seller.swiftBic.message}</ErrorMessage>
              ) : null}
            </div>

            {/* Notes */}
            <div>
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="sellerNotes">Notes</Label>
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name="seller.notesFieldIsVisible"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Switch
                          {...field}
                          id="sellerNotesFieldIsVisible"
                          checked={value}
                          onCheckedChange={onChange}
                          size="sm"
                          data-testid="sellerNotesInvoiceFormFieldVisibilitySwitch"
                          aria-label="Show the 'Notes' field in the PDF"
                        />
                      );
                    }}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor="sellerNotesFieldIsVisible">
                        Show in PDF
                      </Label>
                    }
                    content={"Show the 'Notes' field in the PDF"}
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
                      id="sellerNotes"
                      rows={3}
                      className={inputErrorClassName(!!errors.seller?.notes)}
                    />
                  );
                }}
              />
              {errors.seller?.notes ? (
                <ErrorMessage>{errors.seller.notes.message}</ErrorMessage>
              ) : null}
            </div>
          </fieldset>
        )}
      </AccordionContent>
    </div>
  );
});
