"use client";

import { memo, useState } from "react";
import { type Control, type UseFormSetValue } from "react-hook-form";

import { BuyerManagement } from "@/app/(main)/(app)/components/invoice-form/sections/components/buyer/buyer-management";
import { SavedContactCard } from "@/app/(main)/(app)/components/invoice-form/sections/components/contact-fields";
import { PartyFields } from "@/app/(main)/(app)/components/invoice-form/sections/components/party-fields";
import { type BuyerData, type InvoiceData } from "@/app/schema";
import { AccordionContent } from "@/components/ui/accordion";

interface BuyerInformationProps {
  control: Control<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  isMobile: boolean;
}

export const BuyerInformation = memo(function BuyerInformation({
  control,
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
        {isBuyerSelected ? (
          <div className="mt-5">
            <SavedContactCard control={control} party="buyer" />
          </div>
        ) : (
          <div className="mt-5">
            <PartyFields
              party="buyer"
              placement="invoice"
              control={control}
              names={{
                name: "buyer.name",
                address: "buyer.address",
                vatNoLabelText: "buyer.vatNoLabelText",
                vatNo: "buyer.vatNo",
                vatNoFieldIsVisible: "buyer.vatNoFieldIsVisible",
                email: "buyer.email",
                emailFieldIsVisible: "buyer.emailFieldIsVisible",
                notes: "buyer.notes",
                notesFieldIsVisible: "buyer.notesFieldIsVisible",
              }}
            />
          </div>
        )}
      </AccordionContent>
    </div>
  );
});
